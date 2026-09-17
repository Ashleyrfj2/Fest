-- Make Supply List workflow transitions and permission-denial evidence
-- database-authoritative. Ordinary clients cannot write or alter audit rows.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE private.supply_mutation_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  actor_role TEXT,
  supply_item_id UUID NOT NULL,
  attempted_action TEXT NOT NULL,
  allowed BOOLEAN NOT NULL,
  reason_code TEXT,
  before_state JSONB,
  after_state JSONB,
  provenance TEXT NOT NULL DEFAULT 'festival-db-supply-audit-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX supply_mutation_audits_trip_created_idx
  ON private.supply_mutation_audits (trip_id, created_at, id);

ALTER TABLE private.supply_mutation_audits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.reject_supply_mutation_audit_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = private, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'supply mutation audits are immutable';
END;
$$;

CREATE TRIGGER supply_mutation_audits_immutable
BEFORE UPDATE OR DELETE ON private.supply_mutation_audits
FOR EACH ROW EXECUTE FUNCTION private.reject_supply_mutation_audit_change();

CREATE OR REPLACE FUNCTION public.reject_forged_supply_denial_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.action_type = 'supply_item_permission_denied' THEN
    RAISE EXCEPTION 'supply permission denials are database-owned audit evidence';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER activity_logs_reject_forged_supply_denial
BEFORE INSERT ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.reject_forged_supply_denial_activity();

CREATE OR REPLACE FUNCTION public.transition_supply_item(
  p_item_id UUID,
  p_transition TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_item public.supply_items%ROWTYPE;
  v_after public.supply_items%ROWTYPE;
  v_role TEXT;
  v_allowed BOOLEAN := FALSE;
  v_reason TEXT;
  v_audit_id UUID;
  v_action_type TEXT;
BEGIN
  IF v_actor_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason_code', 'authentication_required');
  END IF;

  SELECT * INTO v_item
  FROM public.supply_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('applied', false, 'reason_code', 'supply_item_not_found');
  END IF;

  SELECT gm.role INTO v_role
  FROM public.group_members AS gm
  WHERE gm.trip_id = v_item.trip_id
    AND gm.user_id = v_actor_id;

  IF v_role IS NULL THEN
    v_reason := 'not_trip_member';
  ELSIF p_transition NOT IN ('claim', 'unclaim', 'pack', 'unpack') THEN
    v_reason := 'unsupported_transition';
  ELSIF p_transition = 'claim' THEN
    v_allowed := v_item.status = 'unassigned' AND v_item.claimed_by IS NULL;
    IF NOT v_allowed THEN v_reason := 'invalid_state_transition'; END IF;
  ELSIF p_transition = 'unclaim' THEN
    v_allowed := v_item.status = 'claimed'
      AND v_item.claimed_by IS NOT NULL
      AND v_item.claimed_by = v_actor_id;
    IF NOT v_allowed THEN v_reason := 'not_owner_or_invalid_state'; END IF;
  ELSIF p_transition = 'pack' THEN
    v_allowed := v_item.status = 'claimed'
      AND v_item.claimed_by IS NOT NULL
      AND v_item.claimed_by = v_actor_id;
    IF NOT v_allowed THEN v_reason := 'not_owner_or_invalid_state'; END IF;
  ELSIF p_transition = 'unpack' THEN
    v_allowed := v_item.status = 'packed'
      AND v_item.claimed_by IS NOT NULL
      AND v_item.claimed_by = v_actor_id;
    IF NOT v_allowed THEN v_reason := 'not_owner_or_invalid_state'; END IF;
  END IF;

  IF v_allowed THEN
    IF p_transition = 'claim' THEN
      UPDATE public.supply_items
      SET claimed_by = v_actor_id, status = 'claimed'
      WHERE id = v_item.id
      RETURNING * INTO v_after;
      v_action_type := 'supply_item_claimed';
    ELSIF p_transition = 'unclaim' THEN
      UPDATE public.supply_items
      SET claimed_by = NULL, status = 'unassigned'
      WHERE id = v_item.id
      RETURNING * INTO v_after;
      v_action_type := 'supply_item_unclaimed';
    ELSIF p_transition = 'pack' THEN
      UPDATE public.supply_items
      SET status = 'packed'
      WHERE id = v_item.id
      RETURNING * INTO v_after;
      v_action_type := 'supply_item_packed';
    ELSE
      UPDATE public.supply_items
      SET status = 'claimed'
      WHERE id = v_item.id
      RETURNING * INTO v_after;
      v_action_type := 'supply_item_unpacked';
    END IF;

    INSERT INTO public.activity_logs (
      trip_id, user_id, action_type, module, target_id, description
    ) VALUES (
      v_item.trip_id, v_actor_id, v_action_type, 'supply_list', v_item.id,
      'Database-authorized supply transition'
    );
  END IF;

  INSERT INTO private.supply_mutation_audits (
    trip_id, actor_id, actor_role, supply_item_id, attempted_action, allowed,
    reason_code, before_state, after_state
  ) VALUES (
    v_item.trip_id, v_actor_id, v_role, v_item.id, p_transition, v_allowed,
    v_reason, to_jsonb(v_item), CASE WHEN v_allowed THEN to_jsonb(v_after) ELSE NULL END
  ) RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object(
    'applied', v_allowed,
    'audit_id', v_audit_id,
    'reason_code', v_reason,
    'item', CASE WHEN v_allowed THEN to_jsonb(v_after) ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_supply_item(p_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_item public.supply_items%ROWTYPE;
  v_role TEXT;
  v_allowed BOOLEAN := FALSE;
  v_reason TEXT;
  v_audit_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason_code', 'authentication_required');
  END IF;

  SELECT * INTO v_item
  FROM public.supply_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('applied', false, 'reason_code', 'supply_item_not_found');
  END IF;

  SELECT gm.role INTO v_role
  FROM public.group_members AS gm
  WHERE gm.trip_id = v_item.trip_id
    AND gm.user_id = v_actor_id;

  v_allowed := v_role IN ('leader', 'editor');
  IF NOT v_allowed THEN
    v_reason := CASE WHEN v_role IS NULL THEN 'not_trip_member' ELSE 'role_not_authorized' END;
  END IF;

  INSERT INTO private.supply_mutation_audits (
    trip_id, actor_id, actor_role, supply_item_id, attempted_action, allowed,
    reason_code, before_state, after_state
  ) VALUES (
    v_item.trip_id, v_actor_id, v_role, v_item.id, 'delete', v_allowed,
    v_reason, to_jsonb(v_item), NULL
  ) RETURNING id INTO v_audit_id;

  IF v_allowed THEN
    INSERT INTO public.activity_logs (
      trip_id, user_id, action_type, module, target_id, description
    ) VALUES (
      v_item.trip_id, v_actor_id, 'supply_item_deleted', 'supply_list', v_item.id,
      'Database-authorized supply deletion'
    );
    DELETE FROM public.supply_items WHERE id = v_item.id;
  END IF;

  RETURN jsonb_build_object(
    'applied', v_allowed,
    'audit_id', v_audit_id,
    'reason_code', v_reason,
    'item', CASE WHEN v_allowed THEN to_jsonb(v_item) ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.read_supply_mutation_denials(p_trip_id UUID)
RETURNS TABLE (
  audit_id UUID,
  trip_id UUID,
  actor_id UUID,
  actor_role TEXT,
  supply_item_id UUID,
  attempted_action TEXT,
  reason_code TEXT,
  provenance TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT audit.id, audit.trip_id, audit.actor_id, audit.actor_role, audit.supply_item_id,
         audit.attempted_action, audit.reason_code, audit.provenance,
         audit.created_at
  FROM private.supply_mutation_audits AS audit
  WHERE audit.trip_id = p_trip_id
    AND NOT audit.allowed
  ORDER BY audit.created_at, audit.id;
$$;

DROP POLICY IF EXISTS "Trip members can update supply items" ON public.supply_items;

REVOKE UPDATE, DELETE ON public.supply_items FROM authenticated;
GRANT UPDATE (name, quantity, category) ON public.supply_items TO authenticated;

REVOKE ALL ON TABLE private.supply_mutation_audits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transition_supply_item(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_supply_item(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.read_supply_mutation_denials(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_supply_item(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_supply_item(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.read_supply_mutation_denials(UUID) TO service_role;
