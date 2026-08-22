-- Make leadership transfer one atomic, audited database operation.
--
-- The client previously demoted the current leader, promoted the target, and
-- updated trips.leader_id in three independent requests. This migration makes
-- the operation serializable per trip and adds a deferred invariant check so a
-- failed or concurrent write cannot commit an invalid leadership state.

CREATE OR REPLACE FUNCTION public.assert_trip_leadership_consistent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trip_id UUID;
  v_trip_leader_id UUID;
  v_member_leader_id UUID;
  v_leader_count INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'trips' THEN
    v_trip_id := COALESCE(NEW.id, OLD.id);
  ELSE
    v_trip_id := COALESCE(NEW.trip_id, OLD.trip_id);
  END IF;

  SELECT t.leader_id
  INTO v_trip_leader_id
  FROM public.trips AS t
  WHERE t.id = v_trip_id;

  -- A trip delete cascades to group_members. The trip row is allowed to be
  -- absent while the delete statement completes.
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)
  INTO v_leader_count
  FROM public.group_members AS gm
  WHERE gm.trip_id = v_trip_id
    AND gm.role = 'leader';

  IF v_leader_count = 1 THEN
    SELECT gm.user_id
    INTO v_member_leader_id
    FROM public.group_members AS gm
    WHERE gm.trip_id = v_trip_id
      AND gm.role = 'leader'
    LIMIT 1;
  END IF;

  IF v_leader_count <> 1
    OR v_member_leader_id IS DISTINCT FROM v_trip_leader_id THEN
    RAISE EXCEPTION 'Trip % must have exactly one leader matching trips.leader_id', v_trip_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS enforce_group_members_trip_leadership
  ON public.group_members;

CREATE CONSTRAINT TRIGGER enforce_group_members_trip_leadership
AFTER INSERT OR UPDATE OF role, trip_id OR DELETE ON public.group_members
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.assert_trip_leadership_consistent();

DROP TRIGGER IF EXISTS enforce_trips_leadership_consistency
  ON public.trips;

CREATE CONSTRAINT TRIGGER enforce_trips_leadership_consistency
AFTER INSERT OR UPDATE OF leader_id ON public.trips
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.assert_trip_leadership_consistent();

CREATE OR REPLACE FUNCTION public.transfer_trip_leadership(
  p_trip_id UUID,
  p_new_leader_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_leader_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_leader_count INTEGER;
  v_current_leader_name TEXT;
  v_new_leader_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to transfer leadership'
      USING ERRCODE = '42501';
  END IF;

  IF p_trip_id IS NULL OR p_new_leader_id IS NULL THEN
    RAISE EXCEPTION 'Trip and target member are required'
      USING ERRCODE = '22004';
  END IF;

  -- Lock the parent first. Every transfer for a trip therefore serializes on
  -- one row before reading or changing membership state.
  SELECT t.leader_id
  INTO v_current_leader_id
  FROM public.trips AS t
  WHERE t.id = p_trip_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Lock every membership row for the trip in a stable order. This prevents a
  -- concurrent role update/removal from interleaving after the trip lock.
  PERFORM 1
  FROM public.group_members AS gm
  WHERE gm.trip_id = p_trip_id
  ORDER BY gm.user_id
  FOR UPDATE;

  SELECT
    COUNT(*) FILTER (WHERE gm.role = 'leader'),
    MAX(gm.role) FILTER (WHERE gm.user_id = auth.uid()),
    MAX(gm.role) FILTER (WHERE gm.user_id = p_new_leader_id)
  INTO v_leader_count, v_caller_role, v_target_role
  FROM public.group_members AS gm
  WHERE gm.trip_id = p_trip_id;

  IF v_current_leader_id IS DISTINCT FROM auth.uid()
    OR v_caller_role IS DISTINCT FROM 'leader'
    OR v_leader_count <> 1 THEN
    RAISE EXCEPTION 'Only the current leader can transfer leadership'
      USING ERRCODE = '42501';
  END IF;

  IF p_new_leader_id = auth.uid() THEN
    RAISE EXCEPTION 'Select a different member to transfer leadership'
      USING ERRCODE = '22023';
  END IF;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target member is not in this trip'
      USING ERRCODE = 'P0002';
  END IF;

  -- Read names while the membership rows are locked so the single audit row
  -- describes the same transfer that is committed below.
  SELECT u.display_name
  INTO v_current_leader_name
  FROM public.users AS u
  WHERE u.id = auth.uid();

  SELECT u.display_name
  INTO v_new_leader_name
  FROM public.users AS u
  WHERE u.id = p_new_leader_id;

  UPDATE public.group_members
  SET role = 'editor'
  WHERE trip_id = p_trip_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current leader membership disappeared during transfer';
  END IF;

  UPDATE public.group_members
  SET role = 'leader'
  WHERE trip_id = p_trip_id
    AND user_id = p_new_leader_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target membership disappeared during transfer';
  END IF;

  UPDATE public.trips
  SET leader_id = p_new_leader_id
  WHERE id = p_trip_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip disappeared during transfer';
  END IF;

  -- Keep the audit row in the same transaction. If this insert fails, all
  -- membership and trip updates roll back and no partial activity is logged.
  INSERT INTO public.activity_logs (
    trip_id,
    user_id,
    action_type,
    module,
    target_id,
    description
  )
  VALUES (
    p_trip_id,
    auth.uid(),
    'leadership_transferred',
    'collaboration',
    p_new_leader_id,
    format(
      'Transferred leadership from %s to %s',
      COALESCE(v_current_leader_name, 'current leader'),
      COALESCE(v_new_leader_name, 'new leader')
    )
  );

  RETURN p_new_leader_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_trip_leadership_consistent() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transfer_trip_leadership(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_trip_leadership(UUID, UUID) TO authenticated;
