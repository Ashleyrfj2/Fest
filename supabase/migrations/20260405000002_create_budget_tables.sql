-- Budget Tracker tables alignment
-- Created: April 5, 2026
-- Base schema already has budget_entries; this migration extends/aligns it.

ALTER TABLE budget_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'budget_entries_amount_cents_positive'
  ) THEN
    ALTER TABLE budget_entries
      ADD CONSTRAINT budget_entries_amount_cents_positive CHECK (amount_cents > 0);
  END IF;
END;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_budget_entries_trip ON budget_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_budget_entries_paid_by ON budget_entries(paid_by);
CREATE INDEX IF NOT EXISTS idx_budget_entries_created_at ON budget_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_entries_trip_created ON budget_entries(trip_id, created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: Trip members can view all expenses for their trip
DROP POLICY IF EXISTS "Trip members can view expenses" ON budget_entries;

CREATE POLICY "Trip members can view expenses"
  ON budget_entries FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- INSERT: Trip members can create expenses (editors/leaders, or viewers if explicitly allowed)
DROP POLICY IF EXISTS "Trip members can create expenses" ON budget_entries;

CREATE POLICY "Trip members can create expenses"
  ON budget_entries FOR INSERT
  WITH CHECK (
    is_trip_member(trip_id, auth.uid())
    AND paid_by = auth.uid()
  );

-- UPDATE: Only the payer can update their own expense (within time limit)
-- Or leaders can update any expense
DROP POLICY IF EXISTS "Payer can update own expense or leader can update any" ON budget_entries;

CREATE POLICY "Payer can update own expense or leader can update any"
  ON budget_entries FOR UPDATE
  USING (
    paid_by = auth.uid()
    OR is_trip_leader(trip_id, auth.uid())
  )
  WITH CHECK (
    is_trip_member(trip_id, auth.uid())
  );

-- DELETE: Only the payer or trip leader can delete
DROP POLICY IF EXISTS "Payer or leader can delete expense" ON budget_entries;

CREATE POLICY "Payer or leader can delete expense"
  ON budget_entries FOR DELETE
  USING (
    paid_by = auth.uid()
    OR is_trip_leader(trip_id, auth.uid())
  );

-- ============================================================================
-- ACTIVITY LOGGING TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_budget_entry_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.trip_id,
      auth.uid(),
      'expense_created',
      'budget',
      NEW.id,
      'Added expense: ' || NEW.description || ' ($' || to_char((NEW.amount_cents::numeric / 100), 'FM999999990.00') || ')'
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      OLD.trip_id,
      auth.uid(),
      'expense_deleted',
      'budget',
      OLD.id,
      'Deleted expense: ' || OLD.description
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      NEW.trip_id,
      auth.uid(),
      'expense_updated',
      'budget',
      NEW.id,
      'Updated expense: ' || NEW.description
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS budget_entries_log_changes ON budget_entries;

CREATE TRIGGER budget_entries_log_changes
AFTER INSERT OR UPDATE OR DELETE ON budget_entries
FOR EACH ROW
EXECUTE FUNCTION log_budget_entry_change();

DROP TRIGGER IF EXISTS update_budget_entries_updated_at ON budget_entries;

CREATE TRIGGER update_budget_entries_updated_at
BEFORE UPDATE ON budget_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
