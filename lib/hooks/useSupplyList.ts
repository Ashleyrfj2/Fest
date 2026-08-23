/**
 * Supply List Data Hooks
 * Real-time data management for supply items with optimistic updates
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  SupplyItem,
  SupplyItemInsert,
  SupplyItemUpdate,
  SupplyStatus,
  calculateProgress,
  groupByCategory,
} from '@/lib/supplyTypes';
import { useAuth } from '@/lib/auth/AuthContext';

type SupplyMutationResult = {
  applied: boolean;
  audit_id?: string;
  reason_code?: string | null;
  item?: SupplyItem;
};

function parseMutationResult(value: unknown): SupplyMutationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Supply mutation returned an invalid result');
  }
  const result = value as Partial<SupplyMutationResult>;
  if (typeof result.applied !== 'boolean') {
    throw new Error('Supply mutation did not return an authorization decision');
  }
  if (result.applied && (typeof result.audit_id !== 'string' || result.audit_id.length === 0)) {
    throw new Error('Applied supply mutation did not return an audit receipt');
  }
  return result as SupplyMutationResult;
}

/**
 * Hook to fetch and subscribe to supply items for a trip
 */
export function useSupplyList(tripId: string) {
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  // Fetch items with user info
  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('supply_items')
        .select(`
          *,
          claimedByUser:users!supply_items_claimed_by_fkey(id, display_name, avatar_color)
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setItems(data as SupplyItem[]);
    } catch (err) {
      console.error('Error fetching supply items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load supply items');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchItems();

    // Set up real-time subscription
    const channel = supabase
      .channel(`supply_items:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supply_items',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          // Refetch when changes occur
          fetchItems();
        }
      )
      .subscribe((status) => {
        // A change can land while the local Realtime tenant is still starting.
        // Refetch once the channel is live so a late subscription cannot leave
        // this session displaying the pre-subscription snapshot.
        if (status === 'SUBSCRIBED') {
          fetchItems();
        }
      });

    // Local Realtime can cold-start after the page is already interactive.
    // Browser mode keeps a bounded refetch fallback so shared state and the
    // controlled stale-response experiment still converge deterministically.
    const browserRefetch = Platform.OS === 'web'
      ? setInterval(fetchItems, 4_000)
      : null;

    return () => {
      if (browserRefetch) clearInterval(browserRefetch);
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchItems]);

  // Add new item
  const addItem = useCallback(
    async (itemData: Omit<SupplyItemInsert, 'trip_id'>) => {
      try {
        const { data, error: insertError } = await supabase
          .from('supply_items')
          .insert({
            ...itemData,
            trip_id: tripId,
          })
          .select(`
            *,
            claimedByUser:users!supply_items_claimed_by_fkey(id, display_name, avatar_color)
          `)
          .single();

        if (insertError) throw insertError;

        // Optimistic update
        setItems((prev) => [...prev, data as SupplyItem]);

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'supply_item_added',
          module: 'supply_list',
          target_id: data.id,
          description: `Added ${data.name} to supply list`,
        });

        return { data: data as SupplyItem, error: null };
      } catch (err) {
        console.error('Error adding supply item:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to add item',
        };
      }
    },
    [tripId, userProfile?.id]
  );

  // Update item
  const updateItem = useCallback(
    async (itemId: string, updates: SupplyItemUpdate) => {
      try {
        const { data, error: updateError } = await supabase
          .from('supply_items')
          .update(updates)
          .eq('id', itemId)
          .select(`
            *,
            claimedByUser:users!supply_items_claimed_by_fkey(id, display_name, avatar_color)
          `)
          .single();

        if (updateError) throw updateError;

        // Optimistic update
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? (data as SupplyItem) : item))
        );

        return { data: data as SupplyItem, error: null };
      } catch (err) {
        console.error('Error updating supply item:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to update item',
        };
      }
    },
    []
  );

  const transitionItem = useCallback(
    async (itemId: string, transition: 'claim' | 'unclaim' | 'pack' | 'unpack') => {
      try {
        const { data, error: mutationError } = await supabase.rpc('transition_supply_item', {
          p_item_id: itemId,
          p_transition: transition,
        });
        if (mutationError) throw mutationError;
        const result = parseMutationResult(data);
        if (!result.applied || !result.item) {
          return { data: null, error: result.reason_code || 'Supply transition was denied' };
        }
        setItems((previous) => previous.map((item) => (
          item.id === itemId ? result.item as SupplyItem : item
        )));
        await fetchItems();
        return { data: result.item, error: null };
      } catch (err) {
        console.error('Error transitioning supply item:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to transition item',
        };
      }
    },
    [fetchItems]
  );

  // Delete item
  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        const { data, error: deleteError } = await supabase.rpc('delete_supply_item', {
          p_item_id: itemId,
        });
        if (deleteError) throw deleteError;
        const result = parseMutationResult(data);
        if (!result.applied) {
          return { error: result.reason_code || 'Supply deletion was denied' };
        }

        setItems((prev) => prev.filter((item) => item.id !== itemId));
        return { error: null };
      } catch (err) {
        console.error('Error deleting supply item:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete item',
        };
      }
    },
    []
  );

  // Claim item (assign to current user)
  const claimItem = useCallback(
    async (itemId: string) => {
      if (!userProfile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

	  return transitionItem(itemId, 'claim');
    },
    [userProfile?.id, transitionItem]
  );

  // Unclaim item (remove assignment)
  const unclaimItem = useCallback(
    async (itemId: string) => {
	  return transitionItem(itemId, 'unclaim');
    },
    [transitionItem]
  );

  // Toggle pack status
  const togglePacked = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) {
        return { data: null, error: 'Item not found' };
      }

      const newStatus: SupplyStatus = item.status === 'packed' ? 'claimed' : 'packed';

	  return transitionItem(itemId, newStatus === 'packed' ? 'pack' : 'unpack');
    },
    [items, transitionItem]
  );

  // Find duplicate items (fuzzy matching)
  const findDuplicates = useCallback(
    (itemName: string, excludeId?: string): SupplyItem[] => {
      const normalized = itemName.toLowerCase().trim();
      return items.filter((item) => {
        if (excludeId && item.id === excludeId) return false;
        const itemNormalized = item.name.toLowerCase().trim();
        // Simple similarity check - contains or Levenshtein distance < 3
        return (
          itemNormalized.includes(normalized) ||
          normalized.includes(itemNormalized) ||
          levenshteinDistance(normalized, itemNormalized) < 3
        );
      });
    },
    [items]
  );

  // Derived data
  const categoryGroups = groupByCategory(items);
  const progress = calculateProgress(items);

  return {
    items,
    categoryGroups,
    progress,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    claimItem,
    unclaimItem,
    togglePacked,
    findDuplicates,
    refetch: fetchItems,
  };
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
