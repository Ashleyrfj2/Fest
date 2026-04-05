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
  ExpenseSplit,
  MemberBalance,
  Settlement,
  BudgetSummary,
} from '@/lib/budgetTypes';

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
      if (amountCents <= 0) throw new Error('Amount must be greater than zero');
      if (!splitWith.includes(currentUserId)) {
        splitWith = [currentUserId, ...splitWith];
      }

      // Validate custom splits if provided
      if (splitType === 'custom' && customSplits) {
        const totalCents = Object.values(customSplits).reduce((sum, amt) => sum + amt, 0);
        if (totalCents !== amountCents) {
          throw new Error(
            `Custom split total (${totalCents}¢) does not match expense amount (${amountCents}¢)`
          );
        }
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
   * Calculate splits for a single expense
   * Handles both equal and custom split types
   */
  function calculateExpenseSplits(entry: BudgetEntry): ExpenseSplit[] {
    const participants = entry.split_with || [];

    if (entry.split_type === 'custom' && entry.custom_splits) {
      return Object.entries(entry.custom_splits).map(([userId, amountCents]) => ({
        user_id: userId,
        amount_cents: Number(amountCents),
        percentage: (Number(amountCents) / entry.amount_cents) * 100,
      }));
    }

    // Equal split
    if (participants.length === 0) return [];

    const perPersonCents = Math.floor(entry.amount_cents / participants.length);
    const remainderCents =
      entry.amount_cents - perPersonCents * participants.length;

    return participants.map((userId, idx) => ({
      user_id: userId,
      amount_cents: perPersonCents + (idx === 0 ? remainderCents : 0), // Give remainder to first person
      percentage: (entry.amount_cents / participants.length / entry.amount_cents) * 100,
    }));
  }

  /**
   * Calculate settle-up balances from all expenses
   * Returns who owes whom and by how much
   */
  function calculateSettleUp(
    memberIds: string[]
  ): { balances: Map<string, MemberBalance>; settlements: Settlement[] } {
    const balances = new Map<string, MemberBalance>();

    // Initialize balances for all members
    memberIds.forEach((id) => {
      balances.set(id, {
        user_id: id,
        total_paid_cents: 0,
        total_owed_cents: 0,
        net_balance_cents: 0,
      });
    });

    // Apply each expense
    entries.forEach((entry) => {
      const payerBalance = balances.get(entry.paid_by);
      if (payerBalance) {
        payerBalance.total_paid_cents += entry.amount_cents;
      }

      const splits = calculateExpenseSplits(entry);
      splits.forEach((split) => {
        const balance = balances.get(split.user_id);
        if (balance) {
          balance.total_owed_cents += split.amount_cents;
        }
      });
    });

    // Calculate net balance
    balances.forEach((balance) => {
      balance.net_balance_cents = balance.total_paid_cents - balance.total_owed_cents;
    });

    // Derive settlements (who owes whom)
    const settlements: Settlement[] = [];
    const settled = new Set<string>();

    const sortedBalances = Array.from(balances.values()).sort(
      (a, b) => b.net_balance_cents - a.net_balance_cents
    );

    for (let i = 0; i < sortedBalances.length; i++) {
      const creditor = sortedBalances[i];
      if (creditor.net_balance_cents <= 0) break; // No more creditors

      for (let j = sortedBalances.length - 1; j > i; j--) {
        const debtor = sortedBalances[j];
        if (debtor.net_balance_cents >= 0) break; // No more debtors

        const settlementKey = `${debtor.user_id}-${creditor.user_id}`;
        if (settled.has(settlementKey)) continue;

        const amount = Math.min(creditor.net_balance_cents, Math.abs(debtor.net_balance_cents));

        settlements.push({
          from_user_id: debtor.user_id,
          to_user_id: creditor.user_id,
          amount_cents: amount,
        });

        creditor.net_balance_cents -= amount;
        debtor.net_balance_cents += amount;

        settled.add(settlementKey);

        if (creditor.net_balance_cents === 0) break;
      }
    }

    return { balances, settlements };
  }

  /**
   * Get summary for trip
   */
  const getSummary = useCallback(
    (memberIds: string[]): BudgetSummary => {
      const totalExpenses = entries.reduce((sum, e) => sum + e.amount_cents, 0);
      const { balances, settlements } = calculateSettleUp(memberIds);

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
    calculateSettleUp,
    getSummary,
  };
}
