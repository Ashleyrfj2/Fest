import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260825000000_transactional_leadership_transfer.sql'),
  'utf8'
);
const hook = fs.readFileSync(
  path.join(repoRoot, 'lib/hooks/useCollaboration.ts'),
  'utf8'
);

test('successful transfer updates both representations and writes one audit row', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.transfer_trip_leadership\(/);
  assert.match(migration, /UPDATE public\.group_members[\s\S]*SET role = 'editor'/);
  assert.match(migration, /UPDATE public\.group_members[\s\S]*SET role = 'leader'/);
  assert.match(migration, /UPDATE public\.trips[\s\S]*SET leader_id = p_new_leader_id/);
  assert.equal((migration.match(/INSERT INTO public\.activity_logs/g) ?? []).length, 1);
  assert.match(migration, /'leadership_transferred'/);
});

test('missing target and self-transfer fail before any write', () => {
  const validationBlock = migration.match(
    /IF p_new_leader_id = auth\.uid\(\) THEN[\s\S]*?IF v_target_role IS NULL THEN[\s\S]*?END IF;/
  )?.[0];

  assert.ok(validationBlock);
  assert.match(validationBlock, /Select a different member/);
  assert.match(validationBlock, /Target member is not in this trip/);
  assert.ok(validationBlock.indexOf("SET role = 'editor'") === -1);
});

test('nonleaders and unauthenticated callers are rejected by the RPC', () => {
  assert.match(migration, /IF auth\.uid\(\) IS NULL THEN/);
  assert.match(migration, /IF v_current_leader_id IS DISTINCT FROM auth\.uid\(\)/);
  assert.match(migration, /OR v_caller_role IS DISTINCT FROM 'leader'/);
  assert.match(migration, /USING ERRCODE = '42501'/);
  assert.match(hook, /Only the trip leader can transfer leadership/);
});

test('concurrent transfers serialize on the trip and membership rows', () => {
  assert.match(
    migration,
    /FROM public\.trips AS t[\s\S]*WHERE t\.id = p_trip_id[\s\S]*FOR UPDATE;/
  );
  assert.match(
    migration,
    /FROM public\.group_members AS gm[\s\S]*WHERE gm\.trip_id = p_trip_id[\s\S]*ORDER BY gm\.user_id[\s\S]*FOR UPDATE;/
  );
  assert.match(migration, /v_leader_count <> 1/);
  assert.match(migration, /v_current_leader_id IS DISTINCT FROM auth\.uid\(\)/);
});

test('a failed write or audit insert can only roll back the whole transfer', () => {
  assert.match(migration, /Keep the audit row in the same transaction/);
  assert.match(migration, /all[\s\S]*membership and trip updates roll back/);
  assert.match(migration, /IF NOT FOUND THEN[\s\S]*Current leader membership disappeared/);
  assert.match(migration, /IF NOT FOUND THEN[\s\S]*Target membership disappeared/);
  assert.match(migration, /IF NOT FOUND THEN[\s\S]*Trip disappeared/);
  assert.match(hook, /await fetchMembers\(\);/);
});

test('deferred database invariant rejects zero, duplicate, or divergent leaders', () => {
  assert.match(migration, /CREATE CONSTRAINT TRIGGER enforce_group_members_trip_leadership/);
  assert.match(migration, /CREATE CONSTRAINT TRIGGER enforce_trips_leadership_consistency/);
  assert.match(migration, /DEFERRABLE INITIALLY DEFERRED/g);
  assert.match(migration, /v_leader_count <> 1/);
  assert.match(migration, /v_member_leader_id IS DISTINCT FROM v_trip_leader_id/);
  assert.match(migration, /USING ERRCODE = '23514'/);
});

test('the client delegates mutation and does not retain the old three-write sequence', () => {
  assert.match(hook, /supabase\.rpc\(['"]transfer_trip_leadership['"]/);
  assert.match(hook, /p_trip_id: tripId/);
  assert.match(hook, /p_new_leader_id: userId/);
  assert.doesNotMatch(
    hook,
    /from\(['"]group_members['"]\)[\s\S]*\.update\(\{ role: 'editor' \}/
  );
  assert.doesNotMatch(hook, /\.update\(\{ leader_id: userId \}/);
});
