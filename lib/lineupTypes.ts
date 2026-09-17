/**
 * Lineup Scheduler Types
 * Artist voting, consensus, and schedule builder
 */

export type PreferenceType = 'must_see' | 'want_to_see' | 'skip';

export interface LineupArtist {
  id: string;
  trip_id: string;
  name: string;
  stage: string | null;
  day: string | null;
  start_time: string | null;
  end_time: string | null;
  genre: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtistVote {
  artist_id: string;
  user_id: string;
  preference: PreferenceType;
  going_now: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtistWithVotes extends LineupArtist {
  user_vote?: PreferenceType;
  vote_counts: {
    must_see: number;
    want_to_see: number;
    skip: number;
  };
  going_now_count: number;
}

export interface ScheduleConflict {
  artist1_id: string;
  artist1_name: string;
  artist2_id: string;
  artist2_name: string;
  overlap_start: string;
  overlap_end: string;
  reason: string;
}

export interface ConsensusArtist extends LineupArtist {
  must_see_voters: string[];
  vote_count: number;
}

export interface LineupState {
  artists: ArtistWithVotes[];
  conflicts: ScheduleConflict[];
  consensus: ConsensusArtist[];
  userGoingNow: Set<string>;
}
