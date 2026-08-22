-- Allow a newly inserted trip to be returned to its creator before the
-- AFTER INSERT trigger establishes the creator's leader membership.
-- Existing trips remain visible only to their recorded leader or members.

ALTER POLICY "Users can read trips they belong to"
ON public.trips
USING (
  leader_id = auth.uid()
  OR is_trip_member(id, auth.uid())
);
