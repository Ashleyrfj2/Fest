-- Row Level Security (RLS) Policies for FestNest
-- Secures data access based on user membership in trips

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if user is a member of a trip
CREATE OR REPLACE FUNCTION is_trip_member(trip_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE trip_id = trip_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a leader or editor of a trip
CREATE OR REPLACE FUNCTION can_edit_trip(trip_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE trip_id = trip_uuid
      AND user_id = user_uuid
      AND role IN ('leader', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is the trip leader
CREATE OR REPLACE FUNCTION is_trip_leader(trip_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE trip_id = trip_uuid
      AND user_id = user_uuid
      AND role = 'leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Users can read all user profiles (for displaying crew members)
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (ghost account creation)
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TRIPS POLICIES
-- ============================================================================

-- Users can read trips they're members of
CREATE POLICY "Users can read trips they belong to"
  ON trips FOR SELECT
  USING (
    is_trip_member(id, auth.uid())
  );

-- Users can create trips (automatically become leader)
CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = leader_id);

-- Trip leaders can update their trips
CREATE POLICY "Leaders can update their trips"
  ON trips FOR UPDATE
  USING (is_trip_leader(id, auth.uid()));

-- Trip leaders can delete their trips
CREATE POLICY "Leaders can delete their trips"
  ON trips FOR DELETE
  USING (is_trip_leader(id, auth.uid()));

-- ============================================================================
-- GROUP MEMBERS POLICIES
-- ============================================================================

-- Users can read group members for trips they belong to
CREATE POLICY "Users can read group members of their trips"
  ON group_members FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Users can join trips (via invite link - handled by application)
CREATE POLICY "Users can join trips"
  ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trip leaders can update member roles
CREATE POLICY "Leaders can update member roles"
  ON group_members FOR UPDATE
  USING (is_trip_leader(trip_id, auth.uid()));

-- Trip leaders can remove members
CREATE POLICY "Leaders can remove members"
  ON group_members FOR DELETE
  USING (is_trip_leader(trip_id, auth.uid()));

-- Users can leave trips
CREATE POLICY "Users can leave trips"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- CAMP POLICIES (Camp Grid & Items)
-- ============================================================================

-- Trip members can read camp grids
CREATE POLICY "Trip members can read camp grids"
  ON camp_grids FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Editors and leaders can manage camp grids
CREATE POLICY "Editors can manage camp grids"
  ON camp_grids FOR ALL
  USING (can_edit_trip(trip_id, auth.uid()));

-- Trip members can read camp items
CREATE POLICY "Trip members can read camp items"
  ON camp_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM camp_grids
      WHERE camp_grids.trip_id = camp_items.grid_id
        AND is_trip_member(camp_grids.trip_id, auth.uid())
    )
  );

-- Editors can manage camp items
CREATE POLICY "Editors can manage camp items"
  ON camp_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM camp_grids
      WHERE camp_grids.trip_id = camp_items.grid_id
        AND can_edit_trip(camp_grids.trip_id, auth.uid())
    )
  );

-- ============================================================================
-- SUPPLIES POLICIES
-- ============================================================================

-- Trip members can read supply items
CREATE POLICY "Trip members can read supply items"
  ON supply_items FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Trip members can claim/update supply items
CREATE POLICY "Trip members can update supply items"
  ON supply_items FOR UPDATE
  USING (is_trip_member(trip_id, auth.uid()));

-- Editors can create/delete supply items
CREATE POLICY "Editors can manage supply items"
  ON supply_items FOR ALL
  USING (can_edit_trip(trip_id, auth.uid()));

-- ============================================================================
-- FOOD PLANNING POLICIES
-- ============================================================================

-- Trip members can read meal days and meals
CREATE POLICY "Trip members can read meal days"
  ON meal_days FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can read meals"
  ON meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_days
      WHERE meal_days.id = meals.meal_day_id
        AND is_trip_member(meal_days.trip_id, auth.uid())
    )
  );

-- Editors can manage meal days and meals
CREATE POLICY "Editors can manage meal days"
  ON meal_days FOR ALL
  USING (can_edit_trip(trip_id, auth.uid()));

CREATE POLICY "Editors can manage meals"
  ON meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meal_days
      WHERE meal_days.id = meals.meal_day_id
        AND can_edit_trip(meal_days.trip_id, auth.uid())
    )
  );

-- ============================================================================
-- PACKING POLICIES
-- ============================================================================

-- Trip members can read packing items
CREATE POLICY "Trip members can read packing items"
  ON packing_items FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Editors can manage packing items
CREATE POLICY "Editors can manage packing items"
  ON packing_items FOR ALL
  USING (can_edit_trip(trip_id, auth.uid()));

-- Users can read packing checks for their trips
CREATE POLICY "Trip members can read packing checks"
  ON packing_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM packing_items
      WHERE packing_items.id = packing_checks.packing_item_id
        AND is_trip_member(packing_items.trip_id, auth.uid())
    )
  );

-- Users can update their own packing checks
CREATE POLICY "Users can update own packing checks"
  ON packing_checks FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- TRAVEL POLICIES
-- ============================================================================

-- Trip members can read vehicles
CREATE POLICY "Trip members can read vehicles"
  ON vehicles FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Editors and vehicle drivers can manage vehicles
CREATE POLICY "Editors and drivers can manage vehicles"
  ON vehicles FOR ALL
  USING (can_edit_trip(trip_id, auth.uid()) OR driver_id = auth.uid());

-- Trip members can read/manage vehicle passengers
CREATE POLICY "Trip members can read vehicle passengers"
  ON vehicle_passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_passengers.vehicle_id
        AND is_trip_member(vehicles.trip_id, auth.uid())
    )
  );

CREATE POLICY "Trip members can manage vehicle passengers"
  ON vehicle_passengers FOR ALL
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_passengers.vehicle_id
      AND can_edit_trip(vehicles.trip_id, auth.uid())
  ));

-- Trip members can read flight details
CREATE POLICY "Trip members can read flight details"
  ON flight_details FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Users can manage their own flight details
CREATE POLICY "Users can manage own flight details"
  ON flight_details FOR ALL
  USING (user_id = auth.uid());

-- Trip members can read outfit posts
CREATE POLICY "Trip members can read outfit posts"
  ON outfit_posts FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Users can create/manage their own outfit posts
CREATE POLICY "Users can manage own outfit posts"
  ON outfit_posts FOR ALL
  USING (user_id = auth.uid());

-- Trip members can vote on outfits
CREATE POLICY "Trip members can vote on outfits"
  ON outfit_votes FOR ALL
  USING (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM outfit_posts
      WHERE outfit_posts.id = outfit_votes.outfit_post_id
        AND is_trip_member(outfit_posts.trip_id, auth.uid())
    )
  );

-- ============================================================================
-- LINEUP POLICIES
-- ============================================================================

-- Trip members can read lineup artists
CREATE POLICY "Trip members can read lineup artists"
  ON lineup_artists FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Editors can manage lineup artists
CREATE POLICY "Editors can manage lineup artists"
  ON lineup_artists FOR ALL
  USING (can_edit_trip(trip_id, auth.uid()));

-- Trip members can vote on artists
CREATE POLICY "Trip members can vote on artists"
  ON artist_votes FOR ALL
  USING (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM lineup_artists
      WHERE lineup_artists.id = artist_votes.artist_id
        AND is_trip_member(lineup_artists.trip_id, auth.uid())
    )
  );

-- ============================================================================
-- SAFETY PROFILES POLICIES (Self-owned, trip-scoped)
-- ============================================================================

-- Users can only read safety profiles for their trip members
CREATE POLICY "Trip members can read safety profiles"
  ON safety_profiles FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Users can only manage their own safety profile
CREATE POLICY "Users can manage own safety profile"
  ON safety_profiles FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- ACTIVITY LOG POLICIES (Append-only, read-only for members)
-- ============================================================================

-- Trip members can read activity logs
CREATE POLICY "Trip members can read activity logs"
  ON activity_logs FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Trip members can create activity logs (append-only)
CREATE POLICY "Trip members can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (is_trip_member(trip_id, auth.uid()) AND user_id = auth.uid());

-- No updates or deletes allowed on activity logs (append-only)

-- ============================================================================
-- BUDGET POLICIES
-- ============================================================================

-- Trip members can read budget entries
CREATE POLICY "Trip members can read budget entries"
  ON budget_entries FOR SELECT
  USING (is_trip_member(trip_id, auth.uid()));

-- Trip members can create budget entries
CREATE POLICY "Trip members can create budget entries"
  ON budget_entries FOR INSERT
  WITH CHECK (is_trip_member(trip_id, auth.uid()) AND paid_by = auth.uid());

-- Users can update/delete their own budget entries
CREATE POLICY "Users can manage own budget entries"
  ON budget_entries FOR UPDATE
  USING (paid_by = auth.uid());

CREATE POLICY "Users can delete own budget entries"
  ON budget_entries FOR DELETE
  USING (paid_by = auth.uid());
