import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { SupplyItem } from '@/lib/supplyTypes';
import {
  calculateCategoryProgress,
  CategoryProgress,
  groupByCategory,
  PackingAssignedUser,
  PACKING_CATEGORIES,
  PackingItemInsert,
  PackingItemWithState,
} from '@/lib/packingTypes';
import {
  addPackingItem,
  deletePackingItem,
  fetchPackingItems,
  initPackingDb,
  seedStarterPackingItems,
  syncPackingItemsFromSupplyItems,
  updatePackingItem,
} from '@/lib/sqlite/packingDb';

type PackingAssignee = PackingAssignedUser;
const EMPTY_ASSIGNEES: PackingAssignee[] = [];

export function usePackingList(tripId: string, assignees: PackingAssignee[] = EMPTY_ASSIGNEES) {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<PackingItemWithState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadKeyRef = useRef<string | null>(null);

  const loadLocalItems = useCallback(async () => {
    if (!tripId || !userProfile?.id) {
      setItems([]);
      setIsLoading(false);
      return [] as PackingItemWithState[];
    }

    await initPackingDb();
    const nextItems = await fetchPackingItems(tripId, userProfile.id, assignees);
    setItems(nextItems);
    return nextItems;
  }, [assignees, tripId, userProfile?.id]);

  const syncFromSupplyItems = useCallback(async () => {
    if (!tripId || !userProfile?.id) {
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('supply_items')
      .select(
        `
          *,
          claimedByUser:users!supply_items_claimed_by_fkey(id, display_name, avatar_color)
        `
      )
      .eq('trip_id', tripId)
      .eq('claimed_by', userProfile.id);

    if (fetchError) {
      throw fetchError;
    }

    await syncPackingItemsFromSupplyItems(tripId, userProfile.id, (data ?? []) as SupplyItem[]);
  }, [tripId, userProfile?.id]);

  const loadData = useCallback(async (showLoading = false) => {
    if (!tripId || !userProfile?.id) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      await initPackingDb();
      await syncFromSupplyItems();
      await loadLocalItems();
    } catch (err) {
      console.error('Error loading packing items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load packing list');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [loadLocalItems, syncFromSupplyItems, tripId, userProfile?.id]);

  useEffect(() => {
    if (!tripId || !userProfile?.id) {
      initialLoadKeyRef.current = null;
      void loadData(false);
      return;
    }

    const loadKey = `${tripId}:${userProfile.id}`;
    const shouldShowBlockingLoader = initialLoadKeyRef.current !== loadKey;

    void loadData(shouldShowBlockingLoader).then(() => {
      initialLoadKeyRef.current = loadKey;
    });

    const channel = supabase
      .channel(`packing-sync:${tripId}:${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supply_items',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void loadData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, tripId, userProfile?.id]);

  const addItem = useCallback(
    async (itemData: Omit<PackingItemInsert, 'trip_id'>) => {
      if (!tripId || !userProfile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      try {
        await addPackingItem(
          {
            ...itemData,
            trip_id: tripId,
          },
          userProfile.id
        );

        await loadLocalItems();

        return { data: null, error: null };
      } catch (err) {
        console.error('Error adding packing item:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to add packing item',
        };
      }
    },
    [loadLocalItems, tripId, userProfile?.id]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        await deletePackingItem(itemId, tripId, userProfile?.id ?? '');
        await loadLocalItems();
        return { error: null };
      } catch (err) {
        console.error('Error deleting packing item:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete packing item',
        };
      }
    },
    [loadLocalItems]
  );

  const togglePacked = useCallback(
    async (itemId: string) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) {
        return { error: 'Item not found' };
      }

      try {
        await updatePackingItem(itemId, tripId, userProfile?.id ?? '', { packed: !item.packed });
        await loadLocalItems();
        return { error: null };
      } catch (err) {
        console.error('Error toggling packing item:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to update packed state',
        };
      }
    },
    [items, loadLocalItems]
  );

  const assignGroupItem = useCallback(
    async (itemId: string, userId: string | null) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) {
        return { error: 'Item not found' };
      }

      try {
        await updatePackingItem(itemId, tripId, userProfile?.id ?? '', { assigned_to: userId });
        await loadLocalItems();
        return { error: null };
      } catch (err) {
        console.error('Error assigning packing item:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to assign packing item',
        };
      }
    },
    [items, loadLocalItems]
  );

  const loadTemplates = useCallback(async () => {
    if (!tripId || !userProfile?.id) {
      return { inserted: 0, error: 'User not authenticated' };
    }

    try {
      const inserted = await seedStarterPackingItems(tripId, userProfile.id);
      await loadLocalItems();
      return { inserted, error: null };
    } catch (err) {
      console.error('Error loading starter templates:', err);
      return {
        inserted: 0,
        error: err instanceof Error ? err.message : 'Failed to load starter templates',
      };
    }
  }, [loadLocalItems, tripId, userProfile?.id]);

  const categoryGroups = useMemo(() => groupByCategory(items), [items]);

  const categoryProgress: CategoryProgress[] = useMemo(
    () => calculateCategoryProgress(items),
    [items]
  );

  const overallProgress = useMemo(() => {
    const packed = items.filter((item) => item.packed).length;
    const total = items.length;
    const percentPacked = total > 0 ? Math.round((packed / total) * 100) : 0;

    return {
      packed,
      total,
      percentPacked,
    };
  }, [items]);

  const categoryOrder = useMemo(() => PACKING_CATEGORIES.map((category) => category.id), []);

  return {
    items,
    categoryOrder,
    categoryGroups,
    categoryProgress,
    overallProgress,
    isLoading,
    error,
    addItem,
    deleteItem,
    togglePacked,
    assignGroupItem,
    loadTemplates,
    refetch: () => loadData(false),
  };
}
