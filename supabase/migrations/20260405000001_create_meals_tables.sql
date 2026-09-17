-- Align existing meal tables with Food Planner requirements.
-- These tables already exist in the base schema, so use ALTERs instead of re-creating.

ALTER TABLE meal_days
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE meals
  ALTER COLUMN ingredients SET DEFAULT '{}',
  ALTER COLUMN dietary_flags SET DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_days_trip ON meal_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_meal_days_date ON meal_days(trip_id, date);
CREATE INDEX IF NOT EXISTS idx_meals_meal_day ON meals(meal_day_id);
CREATE INDEX IF NOT EXISTS idx_meals_cook ON meals(cook_id);

-- Keep RLS enabled (policies are already defined in base RLS migration)
ALTER TABLE meal_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Ensure meal_days updated_at is maintained.
DROP TRIGGER IF EXISTS update_meal_days_updated_at ON meal_days;

CREATE TRIGGER update_meal_days_updated_at
BEFORE UPDATE ON meal_days
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
