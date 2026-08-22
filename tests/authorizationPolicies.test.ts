import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const hardening = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260822000000_harden_public_security.sql'),
  'utf8'
);
const proposalPolicies = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260405000000_change_proposals.sql'),
  'utf8'
);
const budgetPolicies = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260405000002_create_budget_tables.sql'),
  'utf8'
);
const crossTripHardening = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260824000000_harden_cross_trip_mutations.sql'),
  'utf8'
);
const tripCreatorReturning = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260826000000_allow_trip_creator_returning.sql'),
  'utf8'
);
const liveAuthorizationFixes = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20260827000000_fix_live_authorization_functions.sql'),
  'utf8'
);

test('safety policy and emergency RPC preserve owner and trip-member boundaries', () => {
  assert.match(hardening, /DROP POLICY IF EXISTS "Trip members can read safety profiles"/);
  assert.match(hardening, /user_id = auth\.uid\(\)/g);
  assert.match(hardening, /is_trip_member\(trip_id, auth\.uid\(\)\)/g);
  assert.match(hardening, /p_target_user_id/);
  assert.match(hardening, /WHERE trip_id = p_trip_id AND user_id = auth\.uid\(\)/);
  assert.match(hardening, /WHERE trip_id = p_trip_id AND user_id = p_target_user_id/);
  assert.match(hardening, /REVOKE ALL ON FUNCTION public\.get_emergency_access_profile/);
  assert.match(hardening, /GRANT EXECUTE ON FUNCTION public\.get_emergency_access_profile\(UUID, UUID, TEXT\) TO authenticated/);
  assert.match(hardening, /p_pin IS NULL/);
  assert.match(hardening, /p_pin !~ '\^\[0-9\]\{4,12\}\$'/);
});

test('approval queue policies enforce trip membership, module permissions, and leader resolution', () => {
  assert.match(proposalPolicies, /proposer_id = auth\.uid\(\)/);
  assert.match(proposalPolicies, /is_trip_member\(trip_id, auth\.uid\(\)\)/);
  assert.match(proposalPolicies, /can_edit_module\(trip_id, auth\.uid\(\), module_id\)/);
  assert.match(proposalPolicies, /is_trip_leader\(trip_id, auth\.uid\(\)\)/);
  assert.match(proposalPolicies, /Only pending proposals can be resolved/);
  assert.match(proposalPolicies, /NEW\.resolver_id IS NULL OR NEW\.resolved_at IS NULL/);
});

test('budget RLS keeps reads trip-scoped and writes payer/leader-scoped', () => {
  assert.match(budgetPolicies, /is_trip_member\(trip_id, auth\.uid\(\)\)/g);
  assert.match(budgetPolicies, /paid_by = auth\.uid\(\)/);
  assert.match(budgetPolicies, /is_trip_leader\(trip_id, auth\.uid\(\)\)/);
});

test('shared records cannot be reparented across trips by an UPDATE', () => {
  assert.match(crossTripHardening, /prevent_budget_entry_scope_change/);
  assert.match(crossTripHardening, /NEW\.trip_id IS DISTINCT FROM OLD\.trip_id/);
  assert.match(crossTripHardening, /NEW\.paid_by IS DISTINCT FROM OLD\.paid_by/);
  assert.match(crossTripHardening, /prevent_change_proposal_scope_change/);
  assert.match(crossTripHardening, /NEW\.proposer_id IS DISTINCT FROM OLD\.proposer_id/);
});

test('trip creators can receive INSERT RETURNING rows before membership trigger completion', () => {
  assert.match(
    tripCreatorReturning,
    /ALTER POLICY "Users can read trips they belong to"/
  );
  assert.match(tripCreatorReturning, /leader_id = auth\.uid\(\)/);
  assert.match(tripCreatorReturning, /is_trip_member\(id, auth\.uid\(\)\)/);
});

test('live authorization RPCs qualify output-variable names and proposal JSON extraction', () => {
  assert.match(liveAuthorizationFixes, /gm_requester\.trip_id = p_trip_id/);
  assert.match(liveAuthorizationFixes, /gm_target\.user_id = p_target_user_id/);
  assert.match(liveAuthorizationFixes, /\(NEW\.payload->>'description'\)/);
  assert.match(liveAuthorizationFixes, /COALESCE\(/);
});

test('approval hook passes active-trip and permission context to its UI gate', () => {
  const hook = fs.readFileSync(
    path.join(repoRoot, 'lib/hooks/useApprovalQueue.ts'),
    'utf8'
  );
  const collaboration = fs.readFileSync(
    path.join(repoRoot, 'lib/hooks/useCollaboration.ts'),
    'utf8'
  );

  assert.match(hook, /validateProposalTripScope\(input\.trip_id, tripId\)/);
  assert.match(hook, /canProposeForModule\(/);
  assert.match(collaboration, /currentUserModulePermissions/);
  assert.match(collaboration, /useApprovalQueue\(\s*tripId,\s*currentUserRole/);
});
