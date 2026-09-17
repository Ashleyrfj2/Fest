-- Add shared meetup pin to trips so the travel map persists even when no vehicles exist.
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS meetup_pin JSONB;
