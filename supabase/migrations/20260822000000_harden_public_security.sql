-- Security hardening for public-repo readiness
-- 1) Restrict users profile visibility to self or same-trip members
-- 2) Restrict safety profile reads to profile owner only

DROP POLICY IF EXISTS "Users can read all profiles" ON users;

CREATE POLICY "Users can read related profiles"
  ON users FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM group_members gm_self
      JOIN group_members gm_target
        ON gm_target.trip_id = gm_self.trip_id
      WHERE gm_self.user_id = auth.uid()
        AND gm_target.user_id = users.id
    )
  );

DROP POLICY IF EXISTS "Trip members can read safety profiles" ON safety_profiles;

CREATE POLICY "Users can read own safety profile"
  ON safety_profiles FOR SELECT
  USING (user_id = auth.uid());
