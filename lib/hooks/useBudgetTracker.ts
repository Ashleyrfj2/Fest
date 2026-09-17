/**
 * useBudgetTracker Hook
 *
 * Manages budget entries, split calculations, settle-up summaries,
 * and realtime syncing for a trip.
 *
 * Key features:
 * - Loads and caches budget entries scoped to active trip
 * - Calculates equal and custom splits with validation
 * - Derives settle-up balances without storing second source of truth
 * - Handles activity logging for expense mutations
 * - Realtime updates via onSnapshot
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import {
  BudgetEntry,
  BudgetSummary,
} from '@/lib/budgetTypes';
import {
  calculateExpenseSplits,
  calculateSettleUp,
  validateExpenseInput,
} from '@/lib/budgetSettlements';

type GroupMember = Database['public']['Tables']['group_members']['Row'];

export function useBudgetTracker(tripId: string, currentUserId: string | null) {
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;

    setIsLoading(true);
    setError(null);

    // Load initial entries
    loadEntries();

    // Set up realtime subscription via channel
    const channel = supabase
      .channel(`budget-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_entries',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          loadEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  async function loadEntries() {
    try {
      const { data, error: err } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (err) throw err;

      setEntries((data || []) as BudgetEntry[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(message);
      console.error('Error loading budget entries:', err);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Add a new expense entry
   */
  const addExpense = useCallback(
    async (
      description: string,
      amountCents: number,
      category: string,
      splitWith: string[],
      splitType: 'equal' | 'custom' = 'equal',
      customSplits?: Record<string, number>,
      receiptUrl?: string | null
    ) => {
      if (!currentUserId) throw new Error('User not authenticated');
      if (!splitWith.includes(currentUserId)) {
        splitWith = [currentUserId, ...splitWith];
      }

      const validationError = validateExpenseInput({
        amountCents,
        splitWith,
        splitType,
        customSplits,
        currentUserId,
      });
      if (validationError) {
        throw new Error(validationError);
      }

      try {
        const { data: entry, error: err } = await supabase
          .from('budget_entries')
          .insert({
            trip_id: tripId,
            paid_by: currentUserId,
            amount_cents: amountCents,
            description,
            category,
            split_type: splitType,
            split_with: splitWith,
            custom_splits: customSplits || null,
            receipt_url: receiptUrl || null,
          })
          .select()
          .single();

        if (err) throw err;

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: currentUserId,
          action_type: 'expense_created',
          module: 'budget',
          target_id: entry.id,
          description: `Added expense: ${description} ($${(amountCents / 100).toFixed(2)})`,
        });

        return entry as BudgetEntry;
      } catch (err) {
        console.error('Error adding expense:', err);
        throw err;
      }
    },
    [tripId, currentUserId]
  );

  /**
   * Delete an expense entry
   */
  const deleteExpense = useCallback(
    async (entryId: string) => {
      if (!currentUserId) throw new Error('User not authenticated');

      try {
        const { error: err } = await supabase
          .from('budget_entries')
          .delete()
          .eq('id', entryId);

        if (err) throw err;

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: currentUserId,
          action_type: 'expense_deleted',
          module: 'budget',
          target_id: entryId,
          description: 'Deleted an expense',
        });
      } catch (err) {
        console.error('Error deleting expense:', err);
        throw err;
      }
    },
    [tripId, currentUserId]
  );

  /**
   * Get summary for trip
   */
  const getSummary = useCallback(
    (memberIds: string[]): BudgetSummary => {
      const totalExpenses = entries.reduce((sum, e) => sum + e.amount_cents, 0);
      const { balances, settlements } = calculateSettleUp(entries, memberIds);

      return {
        trip_id: tripId,
        total_expenses_cents: totalExpenses,
        member_balances: balances,
        settlements,
      };
    },
    [entries, tripId]
  );

  return {
    entries,
    isLoading,
    error,
    addExpense,
    deleteExpense,
    calculateExpenseSplits,
    calculateSettleUp: (memberIds: string[]) => calculateSettleUp(entries, memberIds),
    getSummary,
  };
}
