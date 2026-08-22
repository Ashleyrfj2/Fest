import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('demo manifests stay ignored and browser export never exposes the service role', () => {
  const ignore = readFileSync('.gitignore', 'utf8');
  const browserExport = readFileSync('scripts/export-browser-app.mjs', 'utf8');
  assert.match(ignore, /demo\/\.generated\//);
  assert.match(browserExport, /delete exportEnvironment\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(browserExport, /process\.env\.EXPO_PUBLIC_SUPABASE_URL/);
});

test('clean Supabase resets grant API roles while retaining RLS and publish supply changes', () => {
  const grants = readFileSync('supabase/migrations/20260828000000_grant_api_table_privileges.sql', 'utf8');
  const realtime = readFileSync('supabase/migrations/20260829000000_enable_supply_realtime.sql', 'utf8');
  assert.match(grants, /TO authenticated, service_role/);
  assert.doesNotMatch(grants, /TO anon/);
  assert.match(realtime, /ALTER PUBLICATION supabase_realtime ADD TABLE public\.supply_items/);
});
