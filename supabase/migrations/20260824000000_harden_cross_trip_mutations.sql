-- Preserve trip ownership and audit attribution on shared-record updates.
-- RLS WITH CHECK evaluates the proposed row, so a user who belongs to two
-- trips could otherwise reparent an existing row from one trip to another.

CREATE OR REPLACE FUNCTION public.prevent_budget_entry_scope_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.trip_id IS DISTINCT FROM OLD.trip_id
    OR NEW.paid_by IS DISTINCT FROM OLD.paid_by THEN
    RAISE EXCEPTION 'Budget entry trip and payer are immutable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_budget_entry_scope_change ON public.budget_entries;

CREATE TRIGGER prevent_budget_entry_scope_change
BEFORE UPDATE ON public.budget_entries
FOR EACH ROW
EXECUTE FUNCTION public.prevent_budget_entry_scope_change();

CREATE OR REPLACE FUNCTION public.prevent_change_proposal_scope_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.trip_id IS DISTINCT FROM OLD.trip_id
    OR NEW.proposer_id IS DISTINCT FROM OLD.proposer_id THEN
    RAISE EXCEPTION 'Change proposal trip and proposer are immutable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_change_proposal_scope_change ON public.change_proposals;

CREATE TRIGGER prevent_change_proposal_scope_change
BEFORE UPDATE ON public.change_proposals
FOR EACH ROW
EXECUTE FUNCTION public.prevent_change_proposal_scope_change();
