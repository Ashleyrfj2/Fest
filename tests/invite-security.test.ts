import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260823000000_secure_invite_join.sql'),
  'utf8'
);

test('invite security migration validates code and expiry inside the database', () => {
  assert.match(migration, /get_trip_invite_preview\(p_invite_code TEXT\)/);
  assert.match(migration, /join_trip_with_invite\(p_invite_code TEXT\)/);
  assert.match(migration, /invite_expires_at IS NULL OR t\.invite_expires_at > NOW\(\)/g);
  assert.match(migration, /\^\[A-Z0-9\]\{8\}\$/g);
});

test('invite security migration removes arbitrary direct membership inserts', () => {
  assert.match(migration, /DROP POLICY IF EXISTS "Users can join trips"/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.join_trip_with_invite\(TEXT\) TO authenticated/);
  assert.doesNotMatch(migration, /join_trip_with_invite\(TEXT\) TO anon/);
  assert.match(migration, /create_trip_leader_membership/);
});

test('invite entry points use the server-side join RPC', () => {
  for (const relativePath of [
    'app/join/[code].tsx',
    'app/auth/guest-setup.tsx',
    'app/onboarding/set-profile.tsx',
  ]) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /rpc\(\s*['"]join_trip_with_invite['"]/);
    assert.doesNotMatch(source, /from\(['"]group_members['"]\)\.insert/);
  }
});
