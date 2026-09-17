#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const BUILD_ID = 'festnest-demo-001';
const TRIP_ID = '10000000-0000-4000-8000-000000000001';
const ITEM_IDS = {
  canopy: '10000000-0000-4000-8000-000000000101',
  stakes: '10000000-0000-4000-8000-000000000102',
  firstAidKit: '10000000-0000-4000-8000-000000000103',
  water: '10000000-0000-4000-8000-000000000104',
};
const USERS = [
  { actorId: 'leader', email: 'leader@example.test', role: 'leader', displayName: 'Demo Leader' },
  { actorId: 'editor-a', email: 'editor-a@example.test', role: 'editor', displayName: 'Editor A' },
  { actorId: 'viewer-b', email: 'viewer-b@example.test', role: 'viewer', displayName: 'Viewer B' },
  { actorId: 'late-tester-d', email: 'late-d@example.test', role: 'editor', displayName: 'Late Tester D' },
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const manifestPath = path.join(repoRoot, 'demo/.generated/manifest.json');
const supabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const localPassword = process.env.FESTNEST_DEMO_PASSWORD || 'FestNestLocalOnly!2026';

function requireLoopback(rawURL) {
  if (!rawURL) throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
  const parsed = new URL(rawURL);
  const isLoopback = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname);
  if (!isLoopback && process.env.ALLOW_REMOTE_DEMO_RESET !== 'true') {
    throw new Error(`Refusing non-loopback Supabase URL: ${parsed.origin}`);
  }
}

requireLoopback(supabaseURL);
if (!serviceRoleKey || !anonKey) throw new Error('Local anon and service-role keys are required');

const supabase = createClient(supabaseURL, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const signupClient = createClient(supabaseURL, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function unwrap(label, promise) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

await unwrap('remove prior trip', supabase.from('trips').delete().eq('id', TRIP_ID));

const createdUsers = [];
let adminCreateSupported = true;
for (const user of USERS) {
  let createdUser;
  if (adminCreateSupported) {
    const adminResult = await supabase.auth.admin.createUser({
      email: user.email,
      password: localPassword,
      email_confirm: true,
      user_metadata: { display_name: user.displayName, demo_build_id: BUILD_ID },
    });
    if (!adminResult.error) {
      createdUser = adminResult.data.user;
    } else if (/signing method HS256 is invalid|invalid JWT/i.test(adminResult.error.message)) {
      adminCreateSupported = false;
    } else {
      throw new Error(`create ${user.email}: ${adminResult.error.message}`);
    }
  }
  if (!createdUser) {
    const signupResult = await signupClient.auth.signUp({
      email: user.email,
      password: localPassword,
      options: { data: { display_name: user.displayName, demo_build_id: BUILD_ID } },
    });
    if (signupResult.error || !signupResult.data.user) {
      throw new Error(`local signup ${user.email}: ${signupResult.error?.message || 'user was not returned'}`);
    }
    createdUser = signupResult.data.user;
  }
  createdUsers.push({ ...user, id: createdUser.id });
}

const leader = createdUsers[0];
await unwrap(
  'create demo trip',
  supabase.from('trips').insert({
    id: TRIP_ID,
    name: 'Thesis Demo Festival Trip',
    festival_name: 'Synthetic Festival',
    start_date: '2027-08-20',
    end_date: '2027-08-22',
    leader_id: leader.id,
    invite_code: 'THESISV1',
    invite_expires_at: '2027-08-19T00:00:00.000Z',
  })
);

await unwrap(
  'assign demo roles',
  supabase.from('group_members').upsert(
    createdUsers.map((user) => ({
      user_id: user.id,
      trip_id: TRIP_ID,
      role: user.role,
      module_permissions: user.role === 'viewer' ? null : ['supply_list'],
    })),
    { onConflict: 'user_id,trip_id' }
  )
);

await unwrap(
  'seed supply items',
  supabase.from('supply_items').insert([
    { id: ITEM_IDS.canopy, trip_id: TRIP_ID, name: 'Shared Canopy', quantity: 1, category: 'shelter', status: 'unassigned' },
    { id: ITEM_IDS.stakes, trip_id: TRIP_ID, name: 'Canopy Stakes', quantity: 8, category: 'shelter', status: 'unassigned' },
    { id: ITEM_IDS.firstAidKit, trip_id: TRIP_ID, name: 'First-aid Kit', quantity: 1, category: 'medical', status: 'unassigned' },
    { id: ITEM_IDS.water, trip_id: TRIP_ID, name: 'Water Case', quantity: 2, category: 'drinks', status: 'unassigned' },
  ])
);

await unwrap(
  'seed synthetic activity',
  supabase.from('activity_logs').insert({
    trip_id: TRIP_ID,
    user_id: leader.id,
    action_type: 'supply_item_added',
    module: 'supply_list',
    target_id: ITEM_IDS.canopy,
    description: 'Synthetic demo canopy seeded',
  })
);

mkdirSync(path.dirname(manifestPath), { recursive: true });
writeFileSync(
  manifestPath,
  `${JSON.stringify({
    schemaVersion: 1,
    buildId: BUILD_ID,
    tripId: TRIP_ID,
    users: Object.fromEntries(createdUsers.map((user) => [user.actorId, { id: user.id, email: user.email, role: user.role }])),
    supplyItems: ITEM_IDS,
  }, null, 2)}\n`,
  { mode: 0o600 }
);

console.log('Festival thesis demo seeded locally.');
console.log(`Login emails: ${USERS.map((user) => user.email).join(', ')}`);
console.log(`Local-only password: ${localPassword}`);
