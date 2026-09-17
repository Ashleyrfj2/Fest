#!/usr/bin/env node

import process from 'node:process';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const TRIP_ID = '10000000-0000-4000-8000-000000000001';
const EXPECTED_EMAIL_ROLES = new Map([
  ['leader@example.test', 'leader'],
  ['editor-a@example.test', 'editor'],
  ['viewer-b@example.test', 'viewer'],
  ['late-d@example.test', 'editor'],
]);
const EXPECTED_ITEMS = new Map([
  ['10000000-0000-4000-8000-000000000101', ['Shared Canopy', 'unassigned']],
  ['10000000-0000-4000-8000-000000000102', ['Canopy Stakes', 'unassigned']],
  ['10000000-0000-4000-8000-000000000103', ['First-aid Kit', 'unassigned']],
  ['10000000-0000-4000-8000-000000000104', ['Water Case', 'unassigned']],
]);

const supabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const localPassword = process.env.FESTNEST_DEMO_PASSWORD || 'FestNestLocalOnly!2026';
if (!supabaseURL || !serviceRoleKey || !anonKey) throw new Error('Local Supabase URL, anon key, and service-role key are required');
const parsed = new URL(supabaseURL);
if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname) && process.env.ALLOW_REMOTE_DEMO_RESET !== 'true') {
  throw new Error(`Refusing non-loopback Supabase URL: ${parsed.origin}`);
}

const supabase = createClient(supabaseURL, serviceRoleKey, { auth: { persistSession: false } });
async function unwrap(label, promise) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const trips = await unwrap('load trip', supabase.from('trips').select('id,name').eq('id', TRIP_ID));
if (trips.length !== 1 || trips[0].name !== 'Thesis Demo Festival Trip') throw new Error('Expected exactly one stable demo trip');

const members = await unwrap(
  'load members',
  supabase.from('group_members').select('user_id,role,user:users(email)').eq('trip_id', TRIP_ID)
);
if (members.length !== 4) throw new Error(`Expected 4 demo members, found ${members.length}`);
for (const member of members) {
  const relation = Array.isArray(member.user) ? member.user[0] : member.user;
  const email = relation?.email;
  if (!email || EXPECTED_EMAIL_ROLES.get(email) !== member.role) {
    throw new Error(`Unexpected role assignment for ${email || member.user_id}`);
  }
}

const items = await unwrap('load supplies', supabase.from('supply_items').select('id,name,status').eq('trip_id', TRIP_ID));
if (items.length !== EXPECTED_ITEMS.size) throw new Error(`Expected 4 supply items, found ${items.length}`);
for (const item of items) {
  const expected = EXPECTED_ITEMS.get(item.id);
  if (!expected || expected[0] !== item.name || expected[1] !== item.status) {
    throw new Error(`Unexpected supply item state for ${item.id}`);
  }
}

for (const email of EXPECTED_EMAIL_ROLES.keys()) {
  const client = createClient(supabaseURL, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await client.auth.signInWithPassword({ email, password: localPassword });
  if (result.error || !result.data.user || !result.data.session) {
    throw new Error(`Synthetic user cannot sign in: ${email}`);
  }
}

const canonicalState = {
  trip: trips[0],
  roles: members.map((member) => {
    const relation = Array.isArray(member.user) ? member.user[0] : member.user;
    return [relation.email, member.role];
  }).sort((a, b) => a[0].localeCompare(b[0])),
  supplies: items.map((item) => [item.id, item.name, item.status]).sort((a, b) => a[0].localeCompare(b[0])),
};
const fingerprint = createHash('sha256').update(JSON.stringify(canonicalState)).digest('hex');
console.log('Demo seed verification passed: one trip, four confirmed users, exact roles, and four initial supplies.');
console.log(`Deterministic state fingerprint: ${fingerprint}`);
