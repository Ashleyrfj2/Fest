-- Add PIN-gated emergency access fields for safety profiles.
-- These fields allow trip members to unlock emergency info only with the owner's PIN.

ALTER TABLE safety_profiles
  ADD COLUMN IF NOT EXISTS emergency_access_blob TEXT,
  ADD COLUMN IF NOT EXISTS emergency_access_pin_salt TEXT,
  ADD COLUMN IF NOT EXISTS emergency_access_pin_hash TEXT;
