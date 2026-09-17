-- Change Proposals Table for Collaboration Approval Queue
-- Created: April 5, 2026
-- Allows editors to propose changes and leaders to approve/reject them

-- ============================================================================
-- CHANGE PROPOSALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS change_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL, -- e.g. "food", "camp", "supply", "travel", "lineup", "budget"
  target_entity_id UUID, -- optional: the entity being changed (meal, supply_item, vehicle, etc.)
  target_entity_type TEXT, -- optional: e.g. "meal", "supply_item", "vehicle"
  action_type TEXT NOT NULL, -- e.g. "create", "update", "delete"
  -- Normalized payload: { entityId, entityType, field, oldValue, newValue, reason }
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'stale')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT, -- optional resolution notes (e.g. "Already completed", "Not needed")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Trip-scoped queries (find all pending proposals for a trip)
CREATE INDEX IF NOT EXISTS idx_change_proposals_trip_status ON change_proposals(trip_id, status);

-- Module-scoped queries (find proposals for a specific module)
CREATE INDEX IF NOT EXISTS idx_change_proposals_module ON change_proposals(trip_id, module_id);

-- Entity-specific queries (find all proposals for a specific entity)
CREATE INDEX IF NOT EXISTS idx_change_proposals_target_entity ON change_proposals(target_entity_id, status);

-- Proposer queries
CREATE INDEX IF NOT EXISTS idx_change_proposals_proposer ON change_proposals(proposer_id);

-- Time-based queries (newest first)
CREATE INDEX IF NOT EXISTS idx_change_proposals_requested_at ON change_proposals(requested_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE change_proposals ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user can edit a specific module in a trip
-- This checks both trip-wide edit permissions and module-specific permissions
CREATE OR REPLACE FUNCTION can_edit_module(
  trip_uuid UUID,
  user_uuid UUID,
  module_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Leaders can edit all modules
  IF is_trip_leader(trip_uuid, user_uuid) THEN
    RETURN TRUE;
  END IF;

  -- Editors must have specific module permission or be trip-wide editors
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE trip_id = trip_uuid
      AND user_id = user_uuid
      AND role = 'editor'
      AND (
        -- Module-specific permission
        module_permissions @> ARRAY[module_name]::TEXT[]
        -- OR no module permissions means all modules (trip-wide editor)
        OR module_permissions IS NULL
        OR array_length(module_permissions, 1) = 0
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT: Trip members can read proposals for their trip
DROP POLICY IF EXISTS "Trip members can read proposals" ON change_proposals;

CREATE POLICY "Trip members can read proposals"
  ON change_proposals FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- INSERT: Editors can create proposals for modules they can edit
DROP POLICY IF EXISTS "Editors can create proposals for permitted modules" ON change_proposals;

CREATE POLICY "Editors can create proposals for permitted modules"
  ON change_proposals FOR INSERT
  WITH CHECK (
    proposer_id = auth.uid()
    AND is_trip_member(trip_id, auth.uid())
    AND can_edit_module(trip_id, auth.uid(), module_id)
    AND status = 'pending'
  );

-- UPDATE: Leaders can update proposal status (approve/reject)
-- Only leaders can change status; proposers cannot modify their own proposals
DROP POLICY IF EXISTS "Leaders can approve or reject proposals" ON change_proposals;

CREATE POLICY "Leaders can approve or reject proposals"
  ON change_proposals FOR UPDATE
  USING (is_trip_leader(trip_id, auth.uid()))
  WITH CHECK (
    is_trip_leader(trip_id, auth.uid())
    AND status IN ('approved', 'rejected', 'stale')
    AND resolver_id = auth.uid()
    AND resolved_at IS NOT NULL
  );

-- DELETE: Leaders can delete rejected or stale proposals (optional cleanup)
DROP POLICY IF EXISTS "Leaders can delete proposals" ON change_proposals;

CREATE POLICY "Leaders can delete proposals"
  ON change_proposals FOR DELETE
  USING (
    is_trip_leader(trip_id, auth.uid())
    AND status IN ('rejected', 'stale')
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_change_proposals_updated_at ON change_proposals;

CREATE TRIGGER update_change_proposals_updated_at BEFORE UPDATE ON change_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enforce allowed status transitions in SQL (pending -> approved/rejected/stale)
CREATE OR REPLACE FUNCTION validate_change_proposal_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status <> 'pending' THEN
      RAISE EXCEPTION 'Only pending proposals can be resolved';
    END IF;

    IF NEW.status NOT IN ('approved', 'rejected', 'stale') THEN
      RAISE EXCEPTION 'Invalid resolved status: %', NEW.status;
    END IF;

    IF NEW.resolver_id IS NULL OR NEW.resolved_at IS NULL THEN
      RAISE EXCEPTION 'resolver_id and resolved_at are required when resolving a proposal';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_change_proposals_transition ON change_proposals;

CREATE TRIGGER validate_change_proposals_transition
BEFORE UPDATE ON change_proposals
FOR EACH ROW
EXECUTE FUNCTION validate_change_proposal_transition();

-- ============================================================================
-- ACTIVITY LOGGING TRIGGER
-- ============================================================================

-- Function to log proposal creation
CREATE OR REPLACE FUNCTION log_proposal_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.trip_id,
    NEW.proposer_id,
    'proposal_created',
    'collaboration',
    NEW.id,
    'Proposed: ' || NEW.payload->>'description' || ' (' || NEW.module_id || ')'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_proposal_created ON change_proposals;

CREATE TRIGGER trigger_log_proposal_created
AFTER INSERT ON change_proposals
FOR EACH ROW EXECUTE FUNCTION log_proposal_created();

-- Function to log proposal resolution
CREATE OR REPLACE FUNCTION log_proposal_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'stale') THEN
    PERFORM log_activity(
      NEW.trip_id,
      NEW.resolver_id,
      'proposal_' || NEW.status,
      'collaboration',
      NEW.id,
      'Proposal ' || NEW.status || ': ' || COALESCE(NEW.notes, 'No notes') || ' (' || OLD.module_id || ')'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_proposal_resolved ON change_proposals;

CREATE TRIGGER trigger_log_proposal_resolved
AFTER UPDATE ON change_proposals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_proposal_resolved();
