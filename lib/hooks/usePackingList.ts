import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  calculateCategoryProgress,
  CategoryProgress,
  groupByCategory,
  PackingCategory,
  PACKING_CATEGORIES,
  PackingItem,
  PackingItemInsert,
  PackingItemWithState,
} from '@/lib/packingTypes';

const STARTER_TEMPLATES: Array<{ name: string; category: PackingCategory; is_group_item?: boolean }> = [
  { name: 'Tent', category: 'shelter' },
  { name: 'Sleeping bag', category: 'shelter' },
  { name: 'Sleeping pad', category: 'shelter' },
  { name: 'Tarp / rain fly', category: 'shelter' },
  { name: 'Tent stakes', category: 'shelter' },
  { name: 'Mallet', category: 'shelter' },
  { name: 'Earplugs', category: 'festival_gear' },
  { name: 'Portable phone charger', category: 'festival_gear' },
  { name: 'Power bank', category: 'festival_gear' },
  { name: 'Headlamp', category: 'festival_gear' },
  { name: 'Fanny pack', category: 'festival_gear' },
  { name: 'Reusable cup', category: 'festival_gear' },
  { name: 'Rain poncho', category: 'clothing' },
  { name: 'Comfortable shoes', category: 'clothing' },
  { name: 'Layers for cold nights', category: 'clothing' },
  { name: 'Bandana', category: 'clothing' },
  { name: 'Hat / sun protection', category: 'clothing' },
  { name: 'Sunscreen', category: 'hygiene' },
  { name: 'Insect repellent', category: 'hygiene' },
  { name: 'Hand sanitizer', category: 'hygiene' },
  { name: 'Wet wipes', category: 'hygiene' },
  { name: 'Toothbrush + toothpaste', category: 'hygiene' },
  { name: 'Deodorant', category: 'hygiene' },
  { name: 'Personal medications', category: 'medical' },
  { name: 'Pain reliever', category: 'medical' },
  { name: 'Bandages / first aid', category: 'medical' },
  { name: 'Antidiarrheal', category: 'medical' },
  { name: 'Electrolyte packets', category: 'medical' },
  { name: 'Camp stove', category: 'kitchen', is_group_item: true },
  { name: 'Fuel canister', category: 'kitchen', is_group_item: true },
  { name: 'Cooking pot', category: 'kitchen', is_group_item: true },
  { name: 'Utensils', category: 'kitchen' },
  { name: 'Lighter', category: 'kitchen' },
  { name: 'Trash bags', category: 'kitchen' },
  { name: 'Camp chair', category: 'comfort' },
  { name: 'Blanket', category: 'comfort' },
  { name: 'Portable fan', category: 'comfort' },
  { name: 'Eye mask', category: 'comfort' },
  { name: 'Earplugs for sleep', category: 'comfort' },
];

type PackingQueryRow = PackingItem & {
  assignedToUser: Array<{ id: string; display_name: string; avatar_color: string }> | { id: string; display_name: string; avatar_color: string } | null;
};

export function usePackingList(tripId: string) {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<PackingItemWithState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tripItemIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    tripItemIdsRef.current = new Set(items.map((item) => item.id));
  }, [items]);

  const fetchItems = useCallback(async () => {
    if (!tripId || !userProfile?.id) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('packing_items')
        .select(`
          *,
          assignedToUser:users!packing_items_assigned_to_fkey(id, display_name, avatar_color)
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const itemIds = (data ?? []).map((item) => item.id);

      let checksByItemId = new Map<string, boolean>();

      if (itemIds.length > 0) {
        const { data: checksData, error: checksError } = await supabase
          .from('packing_checks')
          .select('packing_item_id, packed')
          .eq('user_id', userProfile.id)
          .in('packing_item_id', itemIds);

        if (checksError) throw checksError;

        checksByItemId = new Map(
          (checksData ?? []).map((check) => [check.packing_item_id, check.packed])
        );
      }

      const normalized = ((data ?? []) as PackingQueryRow[]).map((item) => {
        const assignedToUser = Array.isArray(item.assignedToUser)
          ? item.assignedToUser[0] ?? null
          : item.assignedToUser;

        return {
          id: item.id,
          trip_id: item.trip_id,
          name: item.name,
          category: item.category,
          is_group_item: item.is_group_item,
          assigned_to: item.assigned_to,
          created_at: item.created_at,
          packed: checksByItemId.get(item.id) ?? false,
          assignedToUser,
        };
      });

      setItems(normalized);
    } catch (err) {
      console.error('Error fetching packing items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load packing list');
    } finally {
      setIsLoading(false);
    }
  }, [tripId, userProfile?.id]);

  const logActivity = useCallback(
    async (actionType: string, description: string, targetId?: string) => {
      if (!tripId || !userProfile?.id) return;

      const { error: logError } = await supabase.from('activity_logs').insert({
        trip_id: tripId,
        user_id: userProfile.id,
        action_type: actionType,
        module: 'packing',
        target_id: targetId ?? null,
        description,
      });

      if (logError) {
        console.error('Error logging packing activity:', logError);
      }
    },
    [tripId, userProfile?.id]
  );

  useEffect(() => {
    void fetchItems();

    if (!tripId) return;

    const channel = supabase
      .channel(`packing:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packing_items',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void fetchItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packing_checks',
        },
        (payload) => {
          const newPackingItemId = (payload.new as { packing_item_id?: string } | null)?.packing_item_id;
          const oldPackingItemId = (payload.old as { packing_item_id?: string } | null)?.packing_item_id;
          const changedPackingItemId = newPackingItemId ?? oldPackingItemId;

          if (changedPackingItemId && tripItemIdsRef.current.has(changedPackingItemId)) {
            void fetchItems();
          }
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [fetchItems, tripId]);

  const addItem = useCallback(
    async (itemData: Omit<PackingItemInsert, 'trip_id' | 'created_at' | 'id'>) => {
      try {
        const { data, error: insertError } = await supabase
          .from('packing_items')
          .insert({
            ...itemData,
            trip_id: tripId,
          })
          .select('*')
          .single();

        if (insertError) throw insertError;

        await logActivity('packing_item_added', `Added ${data.name} to packing list`, data.id);

        return { data, error: null };
      } catch (err) {
        console.error('Error adding packing item:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to add packing item',
        };
      }
    },
    [logActivity, tripId]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        const item = items.find((entry) => entry.id === itemId);

        const { error: deleteError } = await supabase
          .from('packing_items')
          .delete()
          .eq('id', itemId)
          .eq('trip_id', tripId);

        if (deleteError) throw deleteError;

        if (item) {
          await logActivity('packing_item_deleted', `Removed ${item.name} from packing list`, item.id);
        }

        return { error: null };
      } catch (err) {
        console.error('Error deleting packing item:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete packing item',
        };
      }
    },
    [items, logActivity, tripId]
  );

  const togglePacked = useCallback(
    async (itemId: string) => {
      if (!userProfile?.id) {
        return { error: 'User not authenticated' };
      }

      const item = items.find((entry) => entry.id === itemId);
      if (!item) {
        return { error: 'Item not found' };
      }

      const nextPacked = !item.packed;

      try {
        const { error: upsertError } = await supabase
          .from('packing_checks')
          .upsert(
            {
              packing_item_id: itemId,
              user_id: userProfile.id,
              packed: nextPacked,
            },
            { onConflict: 'packing_item_id,user_id' }
          );

        if (upsertError) throw upsertError;

        await logActivity(
          nextPacked ? 'packing_item_packed' : 'packing_item_unpacked',
          `${nextPacked ? 'Packed' : 'Unpacked'} ${item.name}`,
          itemId
        );

        return { error: null };
      } catch (err) {
        console.error('Error toggling packing check:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to update packed state',
        };
      }
    },
    [items, logActivity, userProfile?.id]
  );

  const assignGroupItem = useCallback(
    async (itemId: string, userId: string | null) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) {
        return { error: 'Item not found' };
      }

      try {
        const { error: updateError } = await supabase
          .from('packing_items')
          .update({ assigned_to: userId })
          .eq('id', itemId)
          .eq('trip_id', tripId);

        if (updateError) throw updateError;

        await logActivity(
          'packing_item_assigned',
          userId
            ? `Assigned ${item.name} to a crew member`
            : `Cleared assignee for ${item.name}`,
          itemId
        );

        return { error: null };
      } catch (err) {
        console.error('Error assigning packing item:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to assign packing item',
        };
      }
    },
    [items, logActivity, tripId]
  );

  const loadTemplates = useCallback(async () => {
    try {
      const { count, error: countError } = await supabase
        .from('packing_items')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      if (countError) throw countError;

      if ((count ?? 0) > 0) {
        return { inserted: 0, error: null };
      }

      const payload: PackingItemInsert[] = STARTER_TEMPLATES.map((item) => ({
        trip_id: tripId,
        name: item.name,
        category: item.category,
        is_group_item: Boolean(item.is_group_item),
        assigned_to: null,
      }));

      const { error: insertError } = await supabase.from('packing_items').insert(payload);
      if (insertError) throw insertError;

      await logActivity('packing_templates_loaded', 'Loaded starter packing checklist templates');

      return { inserted: payload.length, error: null };
    } catch (err) {
      console.error('Error loading starter templates:', err);
      return {
        inserted: 0,
        error: err instanceof Error ? err.message : 'Failed to load starter templates',
      };
    }
  }, [logActivity, tripId]);

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
    refetch: fetchItems,
  };
}
