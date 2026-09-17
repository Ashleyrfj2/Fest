-- Lineup scheduler alignment
-- Created: April 5, 2026
-- Base schema already has lineup_artists and artist_votes.

ALTER TABLE artist_votes
  ALTER COLUMN going_now SET DEFAULT FALSE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lineup_artists_trip ON lineup_artists(trip_id);
CREATE INDEX IF NOT EXISTS idx_lineup_artists_day ON lineup_artists(day);
CREATE INDEX IF NOT EXISTS idx_lineup_artists_stage ON lineup_artists(stage);

CREATE INDEX IF NOT EXISTS idx_artist_votes_user ON artist_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_votes_artist ON artist_votes(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_votes_preference ON artist_votes(artist_id, preference);
CREATE INDEX IF NOT EXISTS idx_artist_votes_going ON artist_votes(going_now);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE lineup_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ACTIVITY LOGGING TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_artist_vote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      lineup_artists.trip_id,
      auth.uid(),
      'artist_vote_added',
      'lineup',
      NEW.artist_id,
      'Voted ' || NEW.preference || ' for artist: ' || lineup_artists.name
    )
    FROM lineup_artists
    WHERE id = NEW.artist_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.preference != OLD.preference THEN
    PERFORM log_activity(
      lineup_artists.trip_id,
      auth.uid(),
      'artist_vote_changed',
      'lineup',
      NEW.artist_id,
      'Changed vote for artist: ' || lineup_artists.name || ' (' || OLD.preference || ' -> ' || NEW.preference || ')'
    )
    FROM lineup_artists
    WHERE id = NEW.artist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS artist_votes_log_changes ON artist_votes;

CREATE TRIGGER artist_votes_log_changes
AFTER INSERT OR UPDATE ON artist_votes
FOR EACH ROW
EXECUTE FUNCTION log_artist_vote_change();
