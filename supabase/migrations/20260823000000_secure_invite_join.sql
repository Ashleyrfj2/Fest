-- Secure invite previews and membership changes at the database boundary.
-- Direct group_members inserts must not let a caller join an arbitrary trip ID.

CREATE OR REPLACE FUNCTION public.get_trip_invite_preview(p_invite_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  festival_name TEXT,
  start_date DATE,
  end_date DATE,
  invite_expires_at TIMESTAMPTZ,
  member_count BIGINT,
  already_member BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.name,
    t.festival_name,
    t.start_date,
    t.end_date,
    t.invite_expires_at,
    COUNT(gm.user_id)::BIGINT,
    COALESCE(BOOL_OR(gm.user_id = auth.uid()), FALSE)
  FROM public.trips AS t
  LEFT JOIN public.group_members AS gm ON gm.trip_id = t.id
  WHERE t.invite_code = UPPER(TRIM(p_invite_code))
    AND UPPER(TRIM(p_invite_code)) ~ '^[A-Z0-9]{8}$'
  GROUP BY t.id;
$$;

CREATE OR REPLACE FUNCTION public.join_trip_with_invite(p_invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
  v_inserted INTEGER;
BEGIN
  IF auth.uid() IS NULL
    OR UPPER(TRIM(p_invite_code)) !~ '^[A-Z0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT t.id
    INTO v_trip_id
  FROM public.trips AS t
  WHERE t.invite_code = UPPER(TRIM(p_invite_code))
    AND (t.invite_expires_at IS NULL OR t.invite_expires_at > NOW());

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Invite not found or expired';
  END IF;

  INSERT INTO public.group_members (user_id, trip_id, role, module_permissions)
  VALUES (auth.uid(), v_trip_id, 'viewer', NULL)
  ON CONFLICT (user_id, trip_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_trip_id;
END;
$$;

-- Trip creation still needs to establish the creator's leader membership, but
-- callers must not be able to insert arbitrary viewer memberships directly.
CREATE OR REPLACE FUNCTION public.create_trip_leader_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (user_id, trip_id, role, module_permissions)
  VALUES (NEW.leader_id, NEW.id, 'leader', NULL)
  ON CONFLICT (user_id, trip_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_trip_leader_membership ON public.trips;

CREATE TRIGGER create_trip_leader_membership
AFTER INSERT ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.create_trip_leader_membership();

DROP POLICY IF EXISTS "Users can join trips" ON public.group_members;

REVOKE ALL ON FUNCTION public.get_trip_invite_preview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trip_invite_preview(TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.join_trip_with_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_trip_with_invite(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.create_trip_leader_membership() FROM PUBLIC;
