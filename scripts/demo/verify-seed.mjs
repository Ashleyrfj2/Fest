#!/usr/bin/env node

import process from 'node:process';
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
if (!supabaseURL || !serviceRoleKey) throw new Error('Local Supabase URL and service-role key are required');
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

const authData = await unwrap('load auth users', supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }));
const demoUsers = authData.users.filter((user) => user.email && EXPECTED_EMAIL_ROLES.has(user.email));
if (demoUsers.length !== 4 || demoUsers.some((user) => !user.email_confirmed_at)) {
  throw new Error('Expected four confirmed synthetic auth users');
}

console.log('Demo seed verification passed: one trip, four confirmed users, exact roles, and four initial supplies.');
