#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
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
  ['supply_item_reconciled', { state: 'packed', outcome: 'pass' }],
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const manifestPath = path.join(repoRoot, 'demo/.generated/manifest.json');
const supabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const qaAPIBaseURL = process.env.QA_API_BASE_URL || 'http://127.0.0.1:8080';
const qaAPITokens = JSON.parse(process.env.QA_API_TOKENS_JSON || '{}');
const runId = process.env.FESTNEST_EXPERIMENT_RUN_ID;

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
if (Object.keys(qaAPITokens).length === 0) throw new Error('QA_API_TOKENS_JSON is required');
if (!runId) throw new Error('FESTNEST_EXPERIMENT_RUN_ID is required');

// Each explicit experiment run owns an independent durable cursor. A reset
// followed by a different run cannot inherit source keys or step indices.
const runCursorId = createHash('sha256').update(runId).digest('hex').slice(0, 16);
const cursorPath = path.join(repoRoot, `demo/.generated/activity-adapter-cursor-${runCursorId}.json`);
const legacyCursorPath = path.join(repoRoot, 'demo/.generated/activity-adapter-cursor.json');
if (!existsSync(cursorPath) && existsSync(legacyCursorPath)) {
  renameSync(legacyCursorPath, cursorPath);
}

const supabase = createClient(supabaseURL, serviceRoleKey, { auth: { persistSession: false } });
const storedCursor = existsSync(cursorPath) ? JSON.parse(readFileSync(cursorPath, 'utf8')) : {};
const legacyKey = typeof storedCursor.key === 'string' ? storedCursor.key : '';
const cursor = {
  activityKey: typeof storedCursor.activityKey === 'string' ? storedCursor.activityKey : legacyKey,
  auditKey: typeof storedCursor.auditKey === 'string' ? storedCursor.auditKey : '',
  stepIndex: Number.isInteger(storedCursor.stepIndex) ? storedCursor.stepIndex : 0,
};
if (!existsSync(manifestPath)) throw new Error('Run the deterministic demo seed before the activity adapter');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stableActors = new Map(Object.entries(manifest.users || {}).map(([actorId, user]) => [user.id, actorId]));

function deterministicUUID(value) {
  const bytes = Buffer.from(createHash('sha256').update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function persistCursor() {
  mkdirSync(path.dirname(cursorPath), { recursive: true });
  writeFileSync(cursorPath, `${JSON.stringify(cursor, null, 2)}\n`, { mode: 0o600 });
}

async function postEvent(event) {
  const token = qaAPITokens[`automation:${event.actor_id}`] || qaAPITokens[event.actor_id];
  if (!token) throw new Error(`QA_API_TOKENS_JSON has no adapter token for ${event.actor_id}`);
  const response = await fetch(new URL('/api/v1/events', qaAPIBaseURL), {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
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

  const { data: denials, error: denialError } = await supabase.rpc(
    'read_supply_mutation_denials',
    { p_trip_id: TRIP_ID },
  );
  if (denialError) throw denialError;

  const records = [
    ...logs.map((log) => ({ kind: 'activity', id: log.id, created_at: log.created_at, value: log })),
    ...denials.map((audit) => ({ kind: 'denial', id: audit.audit_id, created_at: audit.created_at, value: audit })),
  ].sort((left, right) => `${left.created_at}|${left.id}`.localeCompare(`${right.created_at}|${right.id}`));

  let posted = 0;
  for (const record of records) {
    const key = `${record.created_at}|${record.id}`;
    const cursorField = record.kind === 'denial' ? 'auditKey' : 'activityKey';
    if (key <= cursor[cursorField]) continue;
    if (record.kind === 'activity' && !ACTIONS.has(record.value.action_type)) {
      cursor.activityKey = key;
      persistCursor();
      continue;
    }
    const denial = record.kind === 'denial';
    const source = record.value;
    const mapping = denial
      ? { state: 'permission-denied', outcome: 'blocked' }
      : ACTIONS.get(source.action_type);
    const nextStepIndex = cursor.stepIndex + 1;
    const userId = denial ? source.actor_id : source.user_id;
    const role = denial ? (source.actor_role || roles.get(userId) || 'unknown') : (roles.get(userId) || 'unknown');
    const actorId = stableActors.get(userId);
    if (!actorId) throw new Error(`No stable actor mapping exists for supply evidence user ${userId}`);
    const actionType = denial ? 'supply_item_permission_denied' : source.action_type;
    const targetId = denial ? source.supply_item_id : source.target_id;
    const connectivity = actionType === 'supply_item_packed' ? 'stale' : 'online';
    const context = { role, module: 'supply-list', scenario_id: SCENARIO_ID, connectivity };
    if (denial) {
      context.attempted_action = source.attempted_action;
      context.provenance = source.provenance;
      context.denial_code = source.reason_code || 'authorization_denied';
    }
    const event = {
      event_id: deterministicUUID(denial ? `festival-supply-audit:${source.audit_id}` : `festival-activity:${source.id}`),
      tenant_id: TENANT_ID,
      session_id: `festival-activity-${BUILD_ID}`,
      run_id: runId,
      actor_id: actorId,
      source_type: 'automation',
      source_adapter: 'festival-activity-log-v1',
      build_id: BUILD_ID,
      environment_id: ENVIRONMENT_ID,
      context,
      route: `/trips/${TRIP_ID}/supply-list`,
      state_fingerprint: `supply-list:item:${targetId}:status:${mapping.state}`,
      action_type: actionType,
      outcome: mapping.outcome,
      verifier_result: denial ? 'database_authorization_denied' : undefined,
      occurred_at: source.created_at,
      step_index: nextStepIndex,
      privacy: {
        masked: true,
        redacted_fields: denial
          ? ['private.supply_mutation_audits.before_state', 'private.supply_mutation_audits.after_state']
          : ['activity_logs.description'],
      },
    };
    await postEvent(event);
    cursor.stepIndex = nextStepIndex;
    cursor[cursorField] = key;
    persistCursor();
    posted += 1;
  }
  console.log(`Festival activity adapter posted ${posted} new event(s).`);
}

await pollOnce();
if (process.env.ADAPTER_WATCH === 'true') {
  const pollSerially = async () => {
    try {
      await pollOnce();
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(pollSerially, 2000);
    }
  };
  setTimeout(pollSerially, 2000);
}
