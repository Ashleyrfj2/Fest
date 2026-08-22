-- Fix database-function failures exposed by the live authorization matrix.

-- RETURNS TABLE creates PL/pgSQL variables named trip_id and user_id. Qualify
-- membership columns so they cannot be confused with those output variables.
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
  IF auth.uid() IS NULL OR p_pin IS NULL OR p_pin !~ '^[0-9]{4,12}$' THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.group_members AS gm_requester
    WHERE gm_requester.trip_id = p_trip_id
      AND gm_requester.user_id = auth.uid()
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.group_members AS gm_target
    WHERE gm_target.trip_id = p_trip_id
      AND gm_target.user_id = p_target_user_id
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
      v_expected_hash := split_part(v_stored_hash, '$', 3);
    EXCEPTION WHEN OTHERS THEN
      RETURN;
    END;

    IF v_expected_hash IS NULL
      OR public.verify_emergency_pbkdf2(
        p_pin,
        v_profile.emergency_access_pin_salt,
        v_iterations
      ) IS DISTINCT FROM v_expected_hash THEN
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

-- Parenthesize JSON extraction before text concatenation. Without this,
-- PostgreSQL can select the JSONB || operator and try to parse "Proposed:" as
-- JSON. Also provide a useful description when the optional field is absent.
CREATE OR REPLACE FUNCTION public.log_proposal_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.log_activity(
    NEW.trip_id,
    NEW.proposer_id,
    'proposal_created',
    'collaboration',
    NEW.id,
    'Proposed: ' || COALESCE(
      (NEW.payload->>'description'),
      (NEW.payload->>'summary'),
      (NEW.payload->>'reason'),
      'No description'
    ) || ' (' || NEW.module_id || ')'
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.get_emergency_access_profile(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_emergency_access_profile(UUID, UUID, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.log_proposal_created() FROM PUBLIC;
