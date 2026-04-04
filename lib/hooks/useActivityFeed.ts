import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row'];

type ActivityFeedItem = ActivityLogRow & {
  trip?: Pick<Database['public']['Tables']['trips']['Row'], 'name' | 'festival_name'> | null;
  user?: Pick<Database['public']['Tables']['users']['Row'], 'display_name' | 'avatar_color'> | null;
};

interface FetchOptions {
  showLoading?: boolean;
  showRefreshing?: boolean;
}

export function useActivityFeed() {
  const { userProfile } = useAuth();
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tripIdsRef = useRef<string[]>([]);
  const [subscribedTripIds, setSubscribedTripIds] = useState<string[]>([]);

  const fetchFeed = useCallback(
    async ({ showLoading, showRefreshing }: FetchOptions = {}) => {
      if (!userProfile?.id) {
        tripIdsRef.current = [];
        setFeedItems([]);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (showLoading) setIsLoading(true);
      if (showRefreshing) setIsRefreshing(true);

      try {
        setError(null);

        const { data: membershipData, error: membershipError } = await supabase
          .from('group_members')
          .select('trip_id')
          .eq('user_id', userProfile.id);

        if (membershipError) throw membershipError;

        const tripIds = Array.from(new Set((membershipData ?? []).map((member) => member.trip_id)));
        tripIdsRef.current = tripIds;
        setSubscribedTripIds((prev) => {
          const prevKey = [...prev].sort().join(',');
          const nextKey = [...tripIds].sort().join(',');
          return prevKey === nextKey ? prev : tripIds;
        });

        if (tripIds.length === 0) {
          setFeedItems([]);
          return;
        }

        const { data, error: feedError } = await supabase
          .from('activity_logs')
          .select(
            'id, trip_id, user_id, action_type, module, target_id, description, created_at, trip:trips(name, festival_name), user:users(display_name, avatar_color)'
          )
          .in('trip_id', tripIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (feedError) throw feedError;

        const normalized = ((data ?? []) as Array<ActivityFeedItem & {
          trip?: ActivityFeedItem['trip'][] | ActivityFeedItem['trip'];
          user?: ActivityFeedItem['user'][] | ActivityFeedItem['user'];
        }>).map((item) => ({
          ...item,
          trip: Array.isArray(item.trip) ? item.trip[0] ?? null : item.trip ?? null,
          user: Array.isArray(item.user) ? item.user[0] ?? null : item.user ?? null,
        }));

        setFeedItems(normalized);
      } catch (err) {
        console.error('Error loading cross-trip activity feed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activity feed');
      } finally {
        if (showLoading) setIsLoading(false);
        if (showRefreshing) setIsRefreshing(false);
      }
    },
    [userProfile?.id]
  );

  const refresh = useCallback(async () => {
    await fetchFeed({ showRefreshing: true });
  }, [fetchFeed]);

  useEffect(() => {
    fetchFeed({ showLoading: true });
  }, [fetchFeed]);

  useEffect(() => {
    if (!userProfile?.id || subscribedTripIds.length === 0) return;

    const channels = subscribedTripIds.map((tripId) =>
      supabase
        .channel(`activity_feed:${userProfile.id}:${tripId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `trip_id=eq.${tripId}`,
          },
          () => {
            void fetchFeed();
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => {
        void channel.unsubscribe();
      });
    };
  }, [fetchFeed, subscribedTripIds, userProfile?.id]);

  return {
    feedItems,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
