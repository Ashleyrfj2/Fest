-- Security hardening for public-repo readiness
-- 1) Restrict users profile visibility to self or same-trip members
-- 2) Keep safety profile CRUD owner-only
-- 3) Expose only the emergency-access envelope through a membership-checked RPC

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP POLICY IF EXISTS "Users can read all profiles" ON users;

CREATE POLICY "Users can read related profiles"
  ON users FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM group_members gm_self
      JOIN group_members gm_target
        ON gm_target.trip_id = gm_self.trip_id
      WHERE gm_self.user_id = auth.uid()
        AND gm_target.user_id = users.id
    )
  );

DROP POLICY IF EXISTS "Trip members can read safety profiles" ON safety_profiles;
DROP POLICY IF EXISTS "Users can manage own safety profile" ON safety_profiles;
DROP POLICY IF EXISTS "Users can read own safety profile" ON safety_profiles;
DROP POLICY IF EXISTS "Users can create own safety profile" ON safety_profiles;
DROP POLICY IF EXISTS "Users can update own safety profile" ON safety_profiles;
DROP POLICY IF EXISTS "Users can delete own safety profile" ON safety_profiles;

CREATE POLICY "Users can read own safety profile"
  ON safety_profiles FOR SELECT
  USING (
    user_id = auth.uid()
    AND is_trip_member(trip_id, auth.uid())
  );

CREATE POLICY "Users can create own safety profile"
  ON safety_profiles FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_trip_member(trip_id, auth.uid())
  );

CREATE POLICY "Users can update own safety profile"
  ON safety_profiles FOR UPDATE
  USING (
    user_id = auth.uid()
    AND is_trip_member(trip_id, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND is_trip_member(trip_id, auth.uid())
  );

CREATE POLICY "Users can delete own safety profile"
  ON safety_profiles FOR DELETE
  USING (
    user_id = auth.uid()
    AND is_trip_member(trip_id, auth.uid())
  );

-- PBKDF2-HMAC-SHA256 compatibility for the current client verifier format.
CREATE OR REPLACE FUNCTION public.verify_emergency_pbkdf2(
  p_pin TEXT,
  p_salt_base64 TEXT,
  p_iterations INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_key BYTEA := convert_to(p_pin || ':verify', 'UTF8');
  v_salt BYTEA := decode(p_salt_base64, 'base64');
  v_u BYTEA;
  v_result BYTEA;
  v_index INTEGER;
  v_byte INTEGER;
BEGIN
  IF p_iterations IS NULL OR p_iterations < 100000 OR p_iterations > 500000 THEN
    RETURN NULL;
  END IF;

  v_u := hmac(v_salt || decode('00000001', 'hex'), v_key, 'sha256');
  v_result := v_u;

  FOR v_index IN 2..p_iterations LOOP
    v_u := hmac(v_u, v_key, 'sha256');
    FOR v_byte IN 0..31 LOOP
      v_result := set_byte(v_result, v_byte, get_byte(v_result, v_byte) # get_byte(v_u, v_byte));
    END LOOP;
  END LOOP;

  RETURN encode(v_result, 'base64');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Verify the PIN server-side and return only the ciphertext envelope. The
-- stored hash/verifier is never returned to the requesting trip member.
CREATE OR REPLACE FUNCTION public.get_emergency_access_profile(
  p_trip_id UUID,
  p_target_user_id UUID,
  p_pin TEXT
)
RETURNS TABLE (
  id UUID,
  trip_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  emergency_access_blob TEXT,
  emergency_access_pin_salt TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_profile public.safety_profiles%ROWTYPE;
  v_stored_hash TEXT;
  v_expected_hash TEXT;
  v_iterations INTEGER;
BEGIN
  -- PostgreSQL NULL comparisons are not TRUE; reject NULL explicitly so a
  -- legacy-hash comparison cannot fall through and return the envelope.
  IF auth.uid() IS NULL OR p_pin IS NULL OR p_pin !~ '^[0-9]{4,12}$' THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) OR NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE trip_id = p_trip_id AND user_id = p_target_user_id
  ) THEN
    RETURN;
  END IF;

  SELECT * INTO v_profile
  FROM public.safety_profiles AS sp
  WHERE sp.trip_id = p_trip_id
    AND sp.user_id = p_target_user_id;

  IF NOT FOUND
    OR v_profile.emergency_access_blob IS NULL
    OR v_profile.emergency_access_pin_salt IS NULL
    OR v_profile.emergency_access_pin_hash IS NULL THEN
    RETURN;
  END IF;

  v_stored_hash := v_profile.emergency_access_pin_hash;
  IF split_part(v_stored_hash, '$', 1) = 'pbkdf2_sha256' THEN
    BEGIN
      v_iterations := NULLIF(split_part(v_stored_hash, '$', 2), '')::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      RETURN;
    END;
    v_expected_hash := verify_emergency_pbkdf2(
      p_pin,
      v_profile.emergency_access_pin_salt,
      v_iterations
    );
    IF v_expected_hash IS NULL
      OR v_expected_hash <> split_part(v_stored_hash, '$', 3) THEN
      RETURN;
    END IF;
  ELSIF v_stored_hash !~ '^[0-9a-fA-F]{64}$'
    OR encode(
      digest(convert_to(v_profile.emergency_access_pin_salt || ':' || p_pin, 'UTF8'), 'sha256'),
      'hex'
    ) <> lower(v_stored_hash) THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT
    v_profile.id,
    v_profile.trip_id,
    v_profile.user_id,
    v_profile.created_at,
    v_profile.updated_at,
    v_profile.emergency_access_blob,
    v_profile.emergency_access_pin_salt;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_emergency_pbkdf2(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_emergency_access_profile(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_emergency_access_profile(UUID, UUID, TEXT) TO authenticated;
