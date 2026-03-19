-- FestNest Database Schema
-- 17 entities following docs/data-model.md
-- Created: March 19, 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- User: Registered app user; ghost account on device until email saved
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL, -- hex color
  phone TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trip: Root entity; everything belongs to a Trip
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  festival_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  invite_code TEXT NOT NULL UNIQUE,
  invite_expires_at TIMESTAMPTZ, -- null = permanent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GroupMember: Join table: User × Trip; stores role + module permissions
CREATE TABLE group_members (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('leader', 'editor', 'viewer')),
  module_permissions TEXT[], -- e.g. ["food", "camp"]
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, trip_id)
);

-- ============================================================================
-- CAMP ENTITIES
-- ============================================================================

-- CampGrid: Campsite dimensions + scale; one per trip; offline-first
CREATE TABLE camp_grids (
  trip_id UUID PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
  width_ft NUMERIC(10, 2) NOT NULL,
  height_ft NUMERIC(10, 2) NOT NULL,
  cell_size_ft NUMERIC(10, 2) NOT NULL DEFAULT 2.0, -- e.g. 1 cell = 2ft
  festival_preset TEXT, -- optional preset identifier
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CampItem: Individual placed objects with x/y position + real dimensions
CREATE TABLE camp_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id UUID NOT NULL REFERENCES camp_grids(trip_id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('tent', 'car', 'table', 'canopy', 'fire_pit', 'path', 'custom')),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width_cells INTEGER NOT NULL,
  height_cells INTEGER NOT NULL,
  real_width_ft NUMERIC(10, 2) NOT NULL,
  real_height_ft NUMERIC(10, 2) NOT NULL,
  label TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  color TEXT, -- hex color
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SUPPLIES + FOOD ENTITIES
-- ============================================================================

-- SupplyItem: Claimable item with workflow status
CREATE TABLE supply_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL CHECK (category IN ('cooking', 'shelter', 'hygiene', 'medical', 'drinks', 'food', 'entertainment', 'misc')),
  status TEXT NOT NULL DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'claimed', 'packed')),
  claimed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MealDay: One day in the food calendar
CREATE TABLE meal_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_label TEXT NOT NULL, -- e.g. "Thursday"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, date)
);

-- Meal: Single meal entry
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_day_id UUID NOT NULL REFERENCES meal_days(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  name TEXT NOT NULL,
  cook_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ingredients TEXT[], -- array of ingredient strings
  dietary_flags TEXT[], -- e.g. ['vegan', 'gluten_free', 'nut_free']
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meal_day_id, slot)
);

-- PackingItem: Checklist item template shared across the trip
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_group_item BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- for group items
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PackingCheck: Per-user packed state for a packing item
CREATE TABLE packing_checks (
  packing_item_id UUID NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  packed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (packing_item_id, user_id)
);

-- ============================================================================
-- TRAVEL ENTITIES
-- ============================================================================

-- Vehicle: Car with driver, capacity, route
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make_model TEXT,
  capacity INTEGER NOT NULL,
  departure_city TEXT,
  departure_time TIMESTAMPTZ,
  waypoints JSONB, -- array of waypoint objects
  meetup_pin JSONB, -- {lat, lng}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VehiclePassenger: Join table: User × Vehicle
CREATE TABLE vehicle_passengers (
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_waypoint_index INTEGER, -- enables "pick up along the route"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vehicle_id, user_id)
);

-- FlightDetail: Flight info per member
CREATE TABLE flight_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  airline TEXT,
  flight_number TEXT,
  arrival_airport TEXT,
  arrival_time TIMESTAMPTZ,
  needs_pickup BOOLEAN NOT NULL DEFAULT FALSE,
  pickup_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, user_id)
);

-- OutfitPost: Outfit photo upload per member per trip
CREATE TABLE outfit_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OutfitVote: Thumbs up/down per user per outfit
CREATE TABLE outfit_votes (
  outfit_post_id UUID NOT NULL REFERENCES outfit_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (outfit_post_id, user_id)
);

-- ============================================================================
-- LINEUP ENTITIES
-- ============================================================================

-- LineupArtist: Artist on the festival lineup
CREATE TABLE lineup_artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage TEXT,
  day TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  genre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ArtistVote: Per-member preference
CREATE TABLE artist_votes (
  artist_id UUID NOT NULL REFERENCES lineup_artists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference TEXT NOT NULL CHECK (preference IN ('must_see', 'want_to_see', 'skip')),
  going_now BOOLEAN NOT NULL DEFAULT FALSE, -- real-time "I'm heading there" signal
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artist_id, user_id)
);

-- ============================================================================
-- SAFETY + ACTIVITY ENTITIES
-- ============================================================================

-- SafetyProfile: Emergency info; encrypted; offline-cached; self-owned
CREATE TABLE safety_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  hometown TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  allergies_food TEXT[],
  allergies_environmental TEXT[],
  allergies_medication TEXT[],
  current_medications TEXT[],
  blood_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, user_id)
);

-- ActivityLog: Append-only feed of all actions
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  module TEXT,
  target_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BudgetEntry: Shared expense with split logic
CREATE TABLE budget_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL, -- stored as cents, never floats
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'supplies', 'fuel', 'activity', 'misc')),
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom')),
  split_with UUID[], -- array of user IDs
  custom_splits JSONB, -- {user_id: amount_cents}
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_seen ON users(last_seen_at);

-- Trip indexes
CREATE INDEX idx_trips_leader ON trips(leader_id);
CREATE INDEX idx_trips_invite_code ON trips(invite_code);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);

-- Group member indexes
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_trip ON group_members(trip_id);
CREATE INDEX idx_group_members_role ON group_members(role);

-- Camp indexes
CREATE INDEX idx_camp_items_grid ON camp_items(grid_id);
CREATE INDEX idx_camp_items_assigned ON camp_items(assigned_to);

-- Supply indexes
CREATE INDEX idx_supply_items_trip ON supply_items(trip_id);
CREATE INDEX idx_supply_items_status ON supply_items(status);
CREATE INDEX idx_supply_items_claimed ON supply_items(claimed_by);

-- Meal indexes
CREATE INDEX idx_meal_days_trip ON meal_days(trip_id);
CREATE INDEX idx_meal_days_date ON meal_days(date);
CREATE INDEX idx_meals_day ON meals(meal_day_id);

-- Packing indexes
CREATE INDEX idx_packing_items_trip ON packing_items(trip_id);
CREATE INDEX idx_packing_checks_user ON packing_checks(user_id);

-- Travel indexes
CREATE INDEX idx_vehicles_trip ON vehicles(trip_id);
CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_flight_details_trip ON flight_details(trip_id);
CREATE INDEX idx_flight_details_user ON flight_details(user_id);
CREATE INDEX idx_outfit_posts_trip ON outfit_posts(trip_id);

-- Lineup indexes
CREATE INDEX idx_lineup_artists_trip ON lineup_artists(trip_id);
CREATE INDEX idx_lineup_artists_day ON lineup_artists(day);
CREATE INDEX idx_artist_votes_artist ON artist_votes(artist_id);
CREATE INDEX idx_artist_votes_user ON artist_votes(user_id);

-- Activity indexes
CREATE INDEX idx_activity_logs_trip ON activity_logs(trip_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- Budget indexes
CREATE INDEX idx_budget_entries_trip ON budget_entries(trip_id);
CREATE INDEX idx_budget_entries_paid_by ON budget_entries(paid_by);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_camp_grids_updated_at BEFORE UPDATE ON camp_grids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_camp_items_updated_at BEFORE UPDATE ON camp_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supply_items_updated_at BEFORE UPDATE ON supply_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packing_checks_updated_at BEFORE UPDATE ON packing_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_details_updated_at BEFORE UPDATE ON flight_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineup_artists_updated_at BEFORE UPDATE ON lineup_artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artist_votes_updated_at BEFORE UPDATE ON artist_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_profiles_updated_at BEFORE UPDATE ON safety_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create activity log entry
CREATE OR REPLACE FUNCTION log_activity(
  p_trip_id UUID,
  p_user_id UUID,
  p_action_type TEXT,
  p_module TEXT,
  p_target_id UUID,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  new_log_id UUID;
BEGIN
  INSERT INTO activity_logs (trip_id, user_id, action_type, module, target_id, description)
  VALUES (p_trip_id, p_user_id, p_action_type, p_module, p_target_id, p_description)
  RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA / SEED (Optional)
-- ============================================================================

-- Add any seed data here if needed for development
