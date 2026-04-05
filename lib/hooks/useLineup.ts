/**
 * useLineup Hook
 * Manages lineup state, voting, consensus calculation, and conflict detection
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineupArtist,
  ArtistVote,
  ArtistWithVotes,
  ScheduleConflict,
  ConsensusArtist,
  PreferenceType,
} from '@/lib/lineupTypes';

interface UseLineupResult {
  artists: ArtistWithVotes[];
  conflicts: ScheduleConflict[];
  consensusArtists: ConsensusArtist[];
  userGoingNow: Set<string>;
  isLoading: boolean;
  error: string | null;
  addArtist: (name: string, stage?: string, day?: string, startTime?: string, endTime?: string, genre?: string) => Promise<{ id?: string; error?: string }>;
  updateArtist: (artistId: string, updates: Partial<LineupArtist>) => Promise<{ error?: string }>;
  deleteArtist: (artistId: string) => Promise<{ error?: string }>;
  voteOnArtist: (artistId: string, preference: PreferenceType | null) => Promise<{ error?: string }>;
  setGoingNow: (artistId: string, going: boolean) => Promise<{ error?: string }>;
  refetch: () => Promise<void>;
}

export function useLineup(tripId: string | undefined, userId: string | undefined): UseLineupResult {
  const [artists, setArtists] = useState<ArtistWithVotes[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [consensusArtists, setConsensusArtists] = useState<ConsensusArtist[]>([]);
  const [userGoingNow, setUserGoingNow] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Detect schedule conflicts between artists with must_see votes
   */
  const detectConflicts = useCallback((artistsData: ArtistWithVotes[]): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = [];
    const mustSeeArtists = artistsData.filter((a) => a.vote_counts.must_see >= 1);

    for (let i = 0; i < mustSeeArtists.length; i++) {
      for (let j = i + 1; j < mustSeeArtists.length; j++) {
        const artist1 = mustSeeArtists[i];
        const artist2 = mustSeeArtists[j];

        // Only check if both have valid time data
        if (!artist1.start_time || !artist1.end_time || !artist2.start_time || !artist2.end_time) {
          continue;
        }

        const start1 = new Date(artist1.start_time).getTime();
        const end1 = new Date(artist1.end_time).getTime();
        const start2 = new Date(artist2.start_time).getTime();
        const end2 = new Date(artist2.end_time).getTime();

        // Check for overlap
        if (start1 < end2 && start2 < end1) {
          const overlapStart = new Date(Math.max(start1, start2));
          const overlapEnd = new Date(Math.min(end1, end2));

          conflicts.push({
            artist1_id: artist1.id,
            artist1_name: artist1.name,
            artist2_id: artist2.id,
            artist2_name: artist2.name,
            overlap_start: overlapStart.toISOString(),
            overlap_end: overlapEnd.toISOString(),
            reason: `${artist1.name} and ${artist2.name} overlap in time`,
          });
        }
      }
    }

    return conflicts;
  }, []);

  /**
   * Calculate consensus artists (3+ must_see votes)
   */
  const calculateConsensus = useCallback((artistsData: ArtistWithVotes[]): ConsensusArtist[] => {
    return artistsData
      .filter((a) => a.vote_counts.must_see >= 3)
      .map((a) => ({
        ...a,
        must_see_voters: [], // Populated by votes query
        vote_count: a.vote_counts.must_see,
      }));
  }, []);

  /**
   * Load all artist data with votes and aggregations
   */
  const loadLineupData = useCallback(async () => {
    if (!tripId) {
      setError('No trip ID provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all artists for this trip
      const { data: artistsData, error: artistsError } = await supabase
        .from('lineup_artists')
        .select('*')
        .eq('trip_id', tripId)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });

      if (artistsError) throw artistsError;

      // Fetch all votes for this trip
      const { data: votesData, error: votesError } = await supabase
        .from('artist_votes')
        .select('*')
        .in('artist_id', (artistsData || []).map((a) => a.id));

      if (votesError) throw votesError;

      // Aggregate vote counts and user's vote per artist
      const voteMap: Record<string, { votes: ArtistVote[]; userVote?: PreferenceType; goingNowCount: number }> = {};
      const userGoingNowSet = new Set<string>();

      (votesData || []).forEach((vote) => {
        if (!voteMap[vote.artist_id]) {
          voteMap[vote.artist_id] = { votes: [], goingNowCount: 0 };
        }
        voteMap[vote.artist_id].votes.push(vote);

        if (vote.user_id === userId) {
          voteMap[vote.artist_id].userVote = vote.preference;
        }

        if (vote.going_now) {
          voteMap[vote.artist_id].goingNowCount += 1;
          if (vote.user_id === userId) {
            userGoingNowSet.add(vote.artist_id);
          }
        }
      });

      // Build ArtistWithVotes array
      const artistsWithVotes: ArtistWithVotes[] = (artistsData || []).map((artist) => {
        const voteInfo = voteMap[artist.id] || { votes: [], goingNowCount: 0 };
        const votes = voteInfo.votes;

        return {
          ...artist,
          user_vote: voteInfo.userVote,
          vote_counts: {
            must_see: votes.filter((v) => v.preference === 'must_see').length,
            want_to_see: votes.filter((v) => v.preference === 'want_to_see').length,
            skip: votes.filter((v) => v.preference === 'skip').length,
          },
          going_now_count: voteInfo.goingNowCount,
        };
      });

      setArtists(artistsWithVotes);
      setUserGoingNow(userGoingNowSet);

      // Calculate derived states
      const detectedConflicts = detectConflicts(artistsWithVotes);
      setConflicts(detectedConflicts);

      const consensus = calculateConsensus(artistsWithVotes);
      setConsensusArtists(consensus);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load lineup';
      setError(message);
      console.error('Error loading lineup:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId, userId, detectConflicts, calculateConsensus]);

  // Initial load and realtime subscription
  useEffect(() => {
    loadLineupData();

    if (!tripId) return;

    // Subscribe to artist changes
    const artistsSubscription = supabase
      .channel(`lineup_artists:trip_id=eq.${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lineup_artists', filter: `trip_id=eq.${tripId}` }, () => {
        loadLineupData();
      })
      .subscribe();

    // Subscribe to vote changes
    const votesSubscription = supabase
      .channel(`artist_votes:lineup_artists.trip_id=eq.${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artist_votes' }, () => {
        loadLineupData();
      })
      .subscribe();

    return () => {
      artistsSubscription.unsubscribe();
      votesSubscription.unsubscribe();
    };
  }, [tripId, loadLineupData]);

  /**
   * Add new artist to lineup
   */
  const addArtist = useCallback(
    async (name: string, stage?: string, day?: string, startTime?: string, endTime?: string, genre?: string) => {
      if (!tripId) return { error: 'No trip ID' };

      try {
        const { data, error: err } = await supabase
          .from('lineup_artists')
          .insert([
            {
              trip_id: tripId,
              name,
              stage: stage || null,
              day: day || null,
              start_time: startTime || null,
              end_time: endTime || null,
              genre: genre || null,
            },
          ])
          .select()
          .single();

        if (err) throw err;
        return { id: data.id };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add artist';
        return { error: message };
      }
    },
    [tripId]
  );

  /**
   * Update artist details
   */
  const updateArtist = useCallback(
    async (artistId: string, updates: Partial<LineupArtist>) => {
      try {
        const { error: err } = await supabase
          .from('lineup_artists')
          .update(updates)
          .eq('id', artistId);

        if (err) throw err;
        return {};
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update artist';
        return { error: message };
      }
    },
    []
  );

  /**
   * Delete artist from lineup
   */
  const deleteArtist = useCallback(async (artistId: string) => {
    try {
      const { error: err } = await supabase.from('lineup_artists').delete().eq('id', artistId);

      if (err) throw err;
      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete artist';
      return { error: message };
    }
  }, []);

  /**
   * Vote on artist (creates or updates vote)
   */
  const voteOnArtist = useCallback(
    async (artistId: string, preference: PreferenceType | null) => {
      if (!userId) return { error: 'No user ID' };

      try {
        if (preference === null) {
          // Delete vote
          const { error: err } = await supabase
            .from('artist_votes')
            .delete()
            .eq('artist_id', artistId)
            .eq('user_id', userId);

          if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows deleted
        } else {
          // Upsert vote
          const { error: err } = await supabase
            .from('artist_votes')
            .upsert(
              [
                {
                  artist_id: artistId,
                  user_id: userId,
                  preference,
                  going_now: userGoingNow.has(artistId),
                },
              ],
              { onConflict: 'artist_id,user_id' }
            );

          if (err) throw err;
        }

        await loadLineupData();
        return {};
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to vote on artist';
        return { error: message };
      }
    },
    [userId, userGoingNow, loadLineupData]
  );

  /**
   * Set "going now" signal for artist
   */
  const setGoingNow = useCallback(
    async (artistId: string, going: boolean) => {
      if (!userId) return { error: 'No user ID' };

      try {
        // Get current vote if exists
        const { data: existingVote } = await supabase
          .from('artist_votes')
          .select('preference')
          .eq('artist_id', artistId)
          .eq('user_id', userId)
          .single();

        // Update or insert vote with going_now flag
        const { error: err } = await supabase
          .from('artist_votes')
          .upsert(
            [
              {
                artist_id: artistId,
                user_id: userId,
                preference: existingVote?.preference || 'want_to_see',
                going_now: going,
              },
            ],
            { onConflict: 'artist_id,user_id' }
          );

        if (err) throw err;

        // Update local state
        const newGoingNow = new Set(userGoingNow);
        if (going) {
          newGoingNow.add(artistId);
        } else {
          newGoingNow.delete(artistId);
        }
        setUserGoingNow(newGoingNow);

        await loadLineupData();
        return {};
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update going now';
        return { error: message };
      }
    },
    [userId, userGoingNow, loadLineupData]
  );

  return {
    artists,
    conflicts,
    consensusArtists,
    userGoingNow,
    isLoading,
    error,
    addArtist,
    updateArtist,
    deleteArtist,
    voteOnArtist,
    setGoingNow,
    refetch: loadLineupData,
  };
}
