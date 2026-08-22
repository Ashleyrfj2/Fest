#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const TENANT_ID = 'festival-thesis-demo';
const BUILD_ID = 'festnest-demo-001';
const ENVIRONMENT_ID = 'festnest-local-browser';
const SCENARIO_ID = 'equipment-handoff-v1';
const TRIP_ID = '10000000-0000-4000-8000-000000000001';
const ACTIONS = new Map([
  ['supply_item_added', { state: 'unassigned', outcome: 'pass' }],
  ['supply_item_claimed', { state: 'claimed', outcome: 'pass' }],
  ['supply_item_packed', { state: 'packed', outcome: 'ambiguous' }],
  ['supply_item_unpacked', { state: 'claimed', outcome: 'pass' }],
  ['supply_item_unclaimed', { state: 'unassigned', outcome: 'pass' }],
  ['supply_item_permission_denied', { state: 'permission-denied', outcome: 'blocked' }],
  ['supply_item_reconciled', { state: 'packed', outcome: 'pass' }],
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const cursorPath = path.join(repoRoot, 'demo/.generated/activity-adapter-cursor.json');
const supabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const qaAPIBaseURL = process.env.QA_API_BASE_URL || 'http://127.0.0.1:8080';

function requireLocalURL(label, rawURL, allowedPorts) {
  if (!rawURL) throw new Error(`${label} is required`);
  const parsed = new URL(rawURL);
  if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname) || !allowedPorts.includes(parsed.port)) {
    throw new Error(`${label} must use an allowlisted loopback origin`);
  }
  return parsed;
}

requireLocalURL('EXPO_PUBLIC_SUPABASE_URL', supabaseURL, ['54321', '54331']);
requireLocalURL('QA_API_BASE_URL', qaAPIBaseURL, ['8080']);
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const supabase = createClient(supabaseURL, serviceRoleKey, { auth: { persistSession: false } });
const cursor = existsSync(cursorPath) ? JSON.parse(readFileSync(cursorPath, 'utf8')) : { key: '', stepIndex: 0 };

function deterministicUUID(value) {
  const bytes = Buffer.from(createHash('sha256').update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function postEvent(event) {
  const response = await fetch(new URL('/api/v1/events', qaAPIBaseURL), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (response.status !== 202 && response.status !== 200) {
    throw new Error(`QA API rejected ${event.event_id} with ${response.status}: ${await response.text()}`);
  }
}

async function pollOnce() {
  const { data: members, error: memberError } = await supabase
    .from('group_members')
    .select('user_id,role')
    .eq('trip_id', TRIP_ID);
  if (memberError) throw memberError;
  const roles = new Map(members.map((member) => [member.user_id, member.role]));

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('id,user_id,action_type,module,target_id,created_at')
    .eq('trip_id', TRIP_ID)
    .eq('module', 'supply_list')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;

  let posted = 0;
  for (const log of logs) {
    const key = `${log.created_at}|${log.id}`;
    if (key <= cursor.key || !ACTIONS.has(log.action_type)) continue;
    const mapping = ACTIONS.get(log.action_type);
    cursor.stepIndex += 1;
    const role = roles.get(log.user_id) || 'unknown';
    const connectivity = log.action_type === 'supply_item_packed' ? 'stale' : 'online';
    const event = {
      event_id: deterministicUUID(`festival-activity:${log.id}`),
      tenant_id: TENANT_ID,
      session_id: `festival-activity-${BUILD_ID}`,
      actor_id: log.user_id,
      source_type: 'automation',
      source_adapter: 'festival-activity-log-v1',
      build_id: BUILD_ID,
      environment_id: ENVIRONMENT_ID,
      context: { role, module: 'supply-list', scenario_id: SCENARIO_ID, connectivity },
      route: `/trips/${TRIP_ID}/supply-list`,
      state_fingerprint: `supply-list:item:${log.target_id}:status:${mapping.state}`,
      action_type: log.action_type,
      outcome: mapping.outcome,
      verifier_result: log.action_type === 'supply_item_permission_denied' ? 'rls_delete_denied' : undefined,
      occurred_at: log.created_at,
      step_index: cursor.stepIndex,
      privacy: { masked: true, redacted_fields: ['activity_logs.description'] },
    };
    await postEvent(event);
    cursor.key = key;
    mkdirSync(path.dirname(cursorPath), { recursive: true });
    writeFileSync(cursorPath, `${JSON.stringify(cursor, null, 2)}\n`, { mode: 0o600 });
    posted += 1;
  }
  console.log(`Festival activity adapter posted ${posted} new event(s).`);
}

await pollOnce();
if (process.env.ADAPTER_WATCH === 'true') {
  setInterval(() => pollOnce().catch((error) => console.error(error)), 2000);
}
