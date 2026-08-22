import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const QA_API_URL = process.env.QA_API_BASE_URL || 'http://127.0.0.1:8080';
const QA_AGENT_API_TOKEN = process.env.QA_AGENT_API_TOKEN;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = process.env.FESTNEST_DEMO_PASSWORD || 'FestNestLocalOnly!2026';
const TRIP_ID = '10000000-0000-4000-8000-000000000001';
const CANOPY_ID = '10000000-0000-4000-8000-000000000101';

function requireLoopback(rawURL: string) {
  const parsed = new URL(rawURL);
  expect(['127.0.0.1', 'localhost', '::1', '[::1]']).toContain(parsed.hostname);
}

async function signIn(email: string) {
  if (!ANON_KEY) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  expect(response.ok).toBeTruthy();
  return response.json() as Promise<{ access_token: string; user: { id: string } }>;
}

function headers(accessToken: string, prefer = 'return=representation') {
  return { apikey: ANON_KEY!, authorization: `Bearer ${accessToken}`, 'content-type': 'application/json', prefer };
}

function eventID(seed: string) {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
}

async function logActivity(accessToken: string, userId: string, actionType: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({
      trip_id: TRIP_ID,
      user_id: userId,
      action_type: actionType,
      module: 'supply_list',
      target_id: CANOPY_ID,
      description: `Synthetic ${actionType}`,
    }),
  });
  expect(response.ok).toBeTruthy();
}

test('equipment handoff preserves shared state and viewer RLS denial', async () => {
	if (!QA_AGENT_API_TOKEN) throw new Error('QA_AGENT_API_TOKEN is required');
  requireLoopback(SUPABASE_URL);
  requireLoopback(QA_API_URL);
  const editor = await signIn('editor-a@example.test');
  const viewer = await signIn('viewer-b@example.test');

  const claimResponse = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}`, {
    method: 'PATCH',
    headers: headers(editor.access_token),
    body: JSON.stringify({ claimed_by: editor.user.id, status: 'claimed' }),
  });
  expect(claimResponse.ok).toBeTruthy();
  await logActivity(editor.access_token, editor.user.id, 'supply_item_claimed');

  const observedClaim = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}&select=id,status,claimed_by`, {
    headers: headers(viewer.access_token),
  }).then((response) => response.json());
  expect(observedClaim).toEqual([{ id: CANOPY_ID, status: 'claimed', claimed_by: editor.user.id }]);

  const packedResponse = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}`, {
    method: 'PATCH',
    headers: headers(editor.access_token),
    body: JSON.stringify({ status: 'packed' }),
  });
  expect(packedResponse.ok).toBeTruthy();
  await logActivity(editor.access_token, editor.user.id, 'supply_item_packed');

  const deniedDelete = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}`, {
    method: 'DELETE',
    headers: headers(viewer.access_token),
  });
  expect(deniedDelete.ok).toBeTruthy();
  expect(await deniedDelete.json()).toEqual([]);

  const stillPresent = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}&select=id,status`, {
    headers: headers(viewer.access_token),
  }).then((response) => response.json());
  expect(stillPresent).toEqual([{ id: CANOPY_ID, status: 'packed' }]);

  const denialLog = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs`, {
    method: 'POST',
    headers: headers(viewer.access_token),
    body: JSON.stringify({
      trip_id: TRIP_ID,
      user_id: viewer.user.id,
      action_type: 'supply_item_permission_denied',
      module: 'supply_list',
      target_id: CANOPY_ID,
      description: 'Synthetic viewer delete denied by RLS',
    }),
  });
  expect(denialLog.ok).toBeTruthy();

  const agentEvent = {
    event_id: eventID(`playwright:${CANOPY_ID}:packed`),
    tenant_id: 'festival-thesis-demo',
    run_id: process.env.FESTNEST_EXPERIMENT_RUN_ID || 'festival-guided-001',
    actor_id: 'playwright-agent-c',
    source_type: 'agent',
    source_adapter: 'playwright',
    build_id: 'festnest-demo-001',
    environment_id: 'festnest-local-browser',
    context: { role: 'editor', browser: 'chromium', connectivity: 'online', scenario_id: 'equipment-handoff-v1' },
    route: `/trips/${TRIP_ID}/supply-list`,
    state_fingerprint: `supply-list:item:${CANOPY_ID}:status:packed`,
    action_type: 'supply_item_reconciled',
    outcome: 'pass',
    verifier_result: 'persisted_status_is_packed',
    occurred_at: process.env.FESTNEST_AGENT_EVENT_TIME || '2026-08-22T15:03:00.000Z',
    step_index: 1,
    privacy: { masked: true },
  };
  const ingest = await fetch(`${QA_API_URL}/api/v1/events`, {
    method: 'POST',
    headers: { authorization: `Bearer ${QA_AGENT_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(agentEvent),
  });
  expect([200, 202]).toContain(ingest.status);
});
