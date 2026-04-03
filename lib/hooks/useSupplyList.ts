/**
 * Supply List Data Hooks
 * Real-time data management for supply items with optimistic updates
 */

import { useState, useEffect, useCallback } from 'react';
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
      .subscribe();

    return () => {
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

  // Delete item
  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        const item = items.find((i) => i.id === itemId);

        const { error: deleteError } = await supabase
          .from('supply_items')
          .delete()
          .eq('id', itemId);

        if (deleteError) throw deleteError;

        // Optimistic update
        setItems((prev) => prev.filter((item) => item.id !== itemId));

        // Log activity
        if (item) {
          await supabase.from('activity_logs').insert({
            trip_id: tripId,
            user_id: userProfile?.id,
            action_type: 'supply_item_deleted',
            module: 'supply_list',
            target_id: itemId,
            description: `Removed ${item.name} from supply list`,
          });
        }

        return { error: null };
      } catch (err) {
        console.error('Error deleting supply item:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete item',
        };
      }
    },
    [items, tripId, userProfile?.id]
  );

  // Claim item (assign to current user)
  const claimItem = useCallback(
    async (itemId: string) => {
      if (!userProfile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      const item = items.find((i) => i.id === itemId);

      const result = await updateItem(itemId, {
        claimed_by: userProfile.id,
        status: 'claimed',
      });

      // Log activity
      if (result.data && item) {
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile.id,
          action_type: 'supply_item_claimed',
          module: 'supply_list',
          target_id: itemId,
          description: `Claimed ${item.name}`,
        });
      }

      return result;
    },
    [userProfile?.id, items, updateItem, tripId]
  );

  // Unclaim item (remove assignment)
  const unclaimItem = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);

      const result = await updateItem(itemId, {
        claimed_by: null,
        status: 'unassigned',
      });

      // Log activity
      if (result.data && item) {
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'supply_item_unclaimed',
          module: 'supply_list',
          target_id: itemId,
          description: `Unclaimed ${item.name}`,
        });
      }

      return result;
    },
    [items, updateItem, tripId, userProfile?.id]
  );

  // Toggle pack status
  const togglePacked = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) {
        return { data: null, error: 'Item not found' };
      }

      const newStatus: SupplyStatus = item.status === 'packed' ? 'claimed' : 'packed';

      const result = await updateItem(itemId, {
        status: newStatus,
      });

      // Log activity
      if (result.data) {
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: newStatus === 'packed' ? 'supply_item_packed' : 'supply_item_unpacked',
          module: 'supply_list',
          target_id: itemId,
          description: `${newStatus === 'packed' ? 'Packed' : 'Unpacked'} ${item.name}`,
        });
      }

      return result;
    },
    [items, updateItem, tripId, userProfile?.id]
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
