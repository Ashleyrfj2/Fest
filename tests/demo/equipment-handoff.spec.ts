import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const QA_API_URL = process.env.QA_API_BASE_URL || 'http://127.0.0.1:8080';
const QA_AGENT_API_TOKEN = process.env.QA_AGENT_API_TOKEN;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const PASSWORD = process.env.FESTNEST_DEMO_PASSWORD || 'FestNestLocalOnly!2026';
const TRIP_ID = '10000000-0000-4000-8000-000000000001';
const CANOPY_ID = '10000000-0000-4000-8000-000000000101';
const STAKES_ID = '10000000-0000-4000-8000-000000000102';
const FIRST_AID_ID = '10000000-0000-4000-8000-000000000103';
const WATER_ID = '10000000-0000-4000-8000-000000000104';

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

async function supplyRPC(accessToken: string, functionName: 'transition_supply_item' | 'delete_supply_item', body: Record<string, string>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify(body),
  });
  expect(response.ok).toBeTruthy();
  return response.json() as Promise<{ applied: boolean; audit_id?: string; reason_code?: string; item?: { status: string; claimed_by: string | null } }>;
}

test('equipment handoff preserves shared state and viewer RLS denial', async () => {
  if (!QA_AGENT_API_TOKEN) throw new Error('QA_AGENT_API_TOKEN is required');
  if (!SERVICE_ROLE_KEY) throw new Error('SERVICE_ROLE_KEY is required');
  requireLoopback(SUPABASE_URL);
  requireLoopback(QA_API_URL);
  const leader = await signIn('leader@example.test');
  const editor = await signIn('editor-a@example.test');
  const viewer = await signIn('viewer-b@example.test');

  const viewerPatch = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}`, {
    method: 'PATCH',
    headers: headers(viewer.access_token),
    body: JSON.stringify({ name: 'Forged Viewer Name', quantity: 99 }),
  });
  if (viewerPatch.ok) expect(await viewerPatch.json()).toEqual([]);
  const viewerDelete = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}`, {
    method: 'DELETE',
    headers: headers(viewer.access_token),
  });
  expect(viewerDelete.ok).toBeFalsy();
  const untouched = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}&select=name,quantity,status`, {
    headers: headers(viewer.access_token),
  }).then((response) => response.json());
  expect(untouched).toEqual([{ name: 'Shared Canopy', quantity: 1, status: 'unassigned' }]);

  const directTransition = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}`, {
    method: 'PATCH',
    headers: headers(editor.access_token),
    body: JSON.stringify({ claimed_by: editor.user.id, status: 'claimed' }),
  });
  expect(directTransition.ok).toBeFalsy();

  const claim = await supplyRPC(editor.access_token, 'transition_supply_item', {
    p_item_id: CANOPY_ID,
    p_transition: 'claim',
  });
  expect(claim.applied).toBeTruthy();
  expect(claim.item).toMatchObject({ status: 'claimed', claimed_by: editor.user.id });

  const observedClaim = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}&select=id,status,claimed_by`, {
    headers: headers(viewer.access_token),
  }).then((response) => response.json());
  expect(observedClaim).toEqual([{ id: CANOPY_ID, status: 'claimed', claimed_by: editor.user.id }]);

  const packed = await supplyRPC(editor.access_token, 'transition_supply_item', {
    p_item_id: CANOPY_ID,
    p_transition: 'pack',
  });
  expect(packed.applied).toBeTruthy();
  expect(packed.item).toMatchObject({ status: 'packed', claimed_by: editor.user.id });

  for (const transition of ['claim', 'pack', 'unpack', 'unclaim'] as const) {
    const result = await supplyRPC(viewer.access_token, 'transition_supply_item', {
      p_item_id: STAKES_ID,
      p_transition: transition,
    });
    expect(result.applied).toBeTruthy();
  }

  const editorClaim = await supplyRPC(editor.access_token, 'transition_supply_item', {
    p_item_id: FIRST_AID_ID,
    p_transition: 'claim',
  });
  expect(editorClaim.applied).toBeTruthy();
  const wrongOwnerPack = await supplyRPC(viewer.access_token, 'transition_supply_item', {
    p_item_id: FIRST_AID_ID,
    p_transition: 'pack',
  });
  expect(wrongOwnerPack).toMatchObject({ applied: false, reason_code: 'not_owner_or_invalid_state' });

  const invalidPack = await supplyRPC(viewer.access_token, 'transition_supply_item', {
    p_item_id: WATER_ID,
    p_transition: 'pack',
  });
  expect(invalidPack).toMatchObject({ applied: false, reason_code: 'not_owner_or_invalid_state' });

  const concurrentClaims = await Promise.all([
    supplyRPC(editor.access_token, 'transition_supply_item', { p_item_id: WATER_ID, p_transition: 'claim' }),
    supplyRPC(viewer.access_token, 'transition_supply_item', { p_item_id: WATER_ID, p_transition: 'claim' }),
  ]);
  expect(concurrentClaims.filter((result) => result.applied)).toHaveLength(1);
  expect(concurrentClaims.filter((result) => !result.applied)).toHaveLength(1);
  const winningIndex = concurrentClaims.findIndex((result) => result.applied);
  const winningToken = winningIndex === 0 ? editor.access_token : viewer.access_token;
  const releaseWater = await supplyRPC(winningToken, 'transition_supply_item', {
    p_item_id: WATER_ID,
    p_transition: 'unclaim',
  });
  expect(releaseWater.applied).toBeTruthy();
  const leaderDelete = await supplyRPC(leader.access_token, 'delete_supply_item', { p_item_id: WATER_ID });
  expect(leaderDelete.applied).toBeTruthy();

  const deniedDelete = await supplyRPC(viewer.access_token, 'delete_supply_item', {
    p_item_id: CANOPY_ID,
  });
  expect(deniedDelete).toMatchObject({ applied: false, reason_code: 'role_not_authorized' });
  expect(deniedDelete.audit_id).toBeTruthy();
  expect(deniedDelete.item).toBeFalsy();

  const stillPresent = await fetch(`${SUPABASE_URL}/rest/v1/supply_items?id=eq.${CANOPY_ID}&select=id,status`, {
    headers: headers(viewer.access_token),
  }).then((response) => response.json());
  expect(stillPresent).toEqual([{ id: CANOPY_ID, status: 'packed' }]);

  const forgedDenial = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs`, {
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
  expect(forgedDenial.ok).toBeFalsy();

  const directAuditRead = await fetch(`${SUPABASE_URL}/rest/v1/supply_mutation_audits?select=id`, {
    headers: headers(viewer.access_token),
  });
  expect(directAuditRead.ok).toBeFalsy();
  const directAuditRPC = await fetch(`${SUPABASE_URL}/rest/v1/rpc/read_supply_mutation_denials`, {
    method: 'POST',
    headers: headers(viewer.access_token),
    body: JSON.stringify({ p_trip_id: TRIP_ID }),
  });
  expect(directAuditRPC.ok).toBeFalsy();

  const denialAuditsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/read_supply_mutation_denials`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ p_trip_id: TRIP_ID }),
  });
  expect(denialAuditsResponse.ok).toBeTruthy();
  const denialAudits = await denialAuditsResponse.json() as Array<{
    audit_id: string;
    actor_id: string;
    actor_role: string;
    attempted_action: string;
    provenance: string;
  }>;
  expect(denialAudits.filter((audit) => audit.audit_id === deniedDelete.audit_id)).toEqual([expect.objectContaining({
    audit_id: deniedDelete.audit_id,
    actor_id: viewer.user.id,
    actor_role: 'viewer',
    attempted_action: 'delete',
    provenance: 'festival-db-supply-audit-v1',
  })]);

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
