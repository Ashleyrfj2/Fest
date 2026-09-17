import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.FESTNEST_LOCAL_URL ?? 'http://127.0.0.1:54321';
const anonKey = process.env.FESTNEST_LOCAL_ANON_KEY;
const serviceRoleKey = process.env.FESTNEST_LOCAL_SERVICE_ROLE_KEY;
const keepFixtures = process.env.FESTNEST_KEEP_FIXTURES === '1';

if (!anonKey || !serviceRoleKey) {
  console.error(
    'Set FESTNEST_LOCAL_ANON_KEY and FESTNEST_LOCAL_SERVICE_ROLE_KEY to compatible local bearer JWTs.'
  );
  process.exitCode = 2;
  process.exit();
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
const password = `Local-QA-${crypto.randomBytes(8).toString('hex')}!`;
const userIds = [];
const tripIds = [];
const budgetFixtures = [];
const results = [];
const warnings = [];

const users = {};
const clients = {};

function makeClient(accessToken) {
  const options = {
    auth: { autoRefreshToken: false, persistSession: false },
  };
  if (accessToken) options.accessToken = async () => accessToken;
  return createClient(url, anonKey, options);
}

function readJwtClaims(token) {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

function makeInvite(prefix) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const suffix = Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
  return `${prefix}${suffix}`;
}

function recordPass(name) {
  results.push({ name, status: 'PASS' });
}

function recordFail(name, error) {
  results.push({
    name,
    status: 'FAIL',
    detail: error?.message ?? String(error),
  });
}

function recordWarning(name, detail) {
  warnings.push({ name, detail });
}

async function check(name, operation) {
  try {
    await operation();
    recordPass(name);
  } catch (error) {
    recordFail(name, error);
  }
}

async function expectError(operation, message) {
  let result;
  try {
    result = await operation();
  } catch {
    return;
  }
  if (!result?.error) {
    throw new Error(message);
  }
}

async function expectNoRows(operation, message) {
  const result = await operation();
  if (result?.error) throw result.error;
  if ((result.data ?? []).length !== 0) {
    throw new Error(message);
  }
}

async function expectNoRowsOrDenied(operation, message) {
  const result = await operation();
  if (result?.error) return;
  if ((result.data ?? []).length !== 0) {
    throw new Error(message);
  }
}

async function createUser(role) {
  const email = `festnest-${role}-${runId.toLowerCase()}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: `QA ${role}`,
      avatar_color: '#C9A84C',
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error(`Auth user was not returned for ${role}`);

  users[role] = data.user;
  userIds.push(data.user.id);

  const authClient = makeClient();
  const signIn = await authClient.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  const accessToken = signIn.data.session?.access_token;
  if (!accessToken) {
    throw new Error(`No authenticated session was returned for ${role}`);
  }
  if (signIn.data.user?.id !== data.user.id) {
    throw new Error(`Authenticated user mismatch for ${role}`);
  }

  const verified = await authClient.auth.getUser(accessToken);
  if (verified.error) throw verified.error;
  if (verified.data.user?.id !== data.user.id) {
    throw new Error(`Access token resolved to the wrong user for ${role}`);
  }

  const claims = readJwtClaims(accessToken);
  if (claims.sub !== data.user.id || claims.role !== 'authenticated') {
    throw new Error(
      `Unexpected access-token claims for ${role}: sub=${claims.sub ?? 'missing'}, role=${claims.role ?? 'missing'}`
    );
  }

  const authenticatedClient = makeClient(accessToken);
  const profile = await authenticatedClient
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile.error) {
    throw new Error(
      `Authenticated RLS preflight failed for ${role} (sub=${claims.sub}, role=${claims.role}): ${profile.error.message}`
    );
  }
  if (profile.data?.id !== data.user.id) {
    throw new Error(`Authenticated client could not read its own profile for ${role}`);
  }

  clients[role] = authenticatedClient;
}

async function createTrip(client, leaderId, inviteCode, expiresAt, name) {
  const { data, error } = await client
    .from('trips')
    .insert({
      name,
      festival_name: 'FestNest Local QA',
      start_date: '2026-09-01',
      end_date: '2026-09-05',
      leader_id: leaderId,
      invite_code: inviteCode,
      invite_expires_at: expiresAt,
    })
    .select('id')
    .single();
  if (error) throw error;
  if (!data?.id) throw new Error('Trip id was not returned');
  tripIds.push(data.id);
  return data.id;
}

async function join(client, inviteCode) {
  const { data, error } = await client.rpc('join_trip_with_invite', {
    p_invite_code: inviteCode,
  });
  if (error) throw error;
  return data;
}

async function countRows(table, filters) {
  let query = admin.from(table).select('*', { count: 'exact', head: true });
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function loadOne(table, filters, columns = '*') {
  let query = admin.from(table).select(columns);
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

async function run() {
  for (const role of ['leader', 'editor', 'viewer', 'secondLeader', 'outsider']) {
    await createUser(role);
  }

  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const inviteOne = makeInvite('QA');
  const inviteTwo = makeInvite('QB');
  const expiredInvite = makeInvite('QE');

  const tripOne = await createTrip(
    clients.leader,
    users.leader.id,
    inviteOne,
    future,
    `Local QA Trip One ${runId}`
  );
  const tripTwo = await createTrip(
    clients.secondLeader,
    users.secondLeader.id,
    inviteTwo,
    future,
    `Local QA Trip Two ${runId}`
  );
  await createTrip(
    clients.leader,
    users.leader.id,
    expiredInvite,
    past,
    `Local QA Expired Trip ${runId}`
  );

  const anonymous = makeClient();

  await check('anonymous invite preview is callable but table reads are scoped', async () => {
    const preview = await anonymous.rpc('get_trip_invite_preview', {
      p_invite_code: inviteOne,
    });
    if (preview.error) throw preview.error;
    if (!preview.data?.length || preview.data[0].already_member !== false) {
      throw new Error('Expected one preview row with already_member=false');
    }
    await expectNoRowsOrDenied(
      () => anonymous.from('trips').select('id').eq('id', tripOne),
      'Anonymous client could read a trip'
    );
  });

  await check('anonymous join and direct membership insert are denied', async () => {
    await expectError(
      () => anonymous.rpc('join_trip_with_invite', { p_invite_code: inviteOne }),
      'Anonymous client could invoke the authenticated join RPC'
    );
    await expectError(
      () =>
        clients.outsider.from('group_members').insert({
          user_id: users.outsider.id,
          trip_id: tripOne,
          role: 'viewer',
        }),
      'Direct membership insertion was allowed'
    );
  });

  await check('leader trigger creates exactly one leader membership', async () => {
    const count = await countRows('group_members', {
      trip_id: tripOne,
      user_id: users.leader.id,
    });
    if (count !== 1) throw new Error(`Expected one leader membership, received ${count}`);
    const membership = await loadOne('group_members', {
      trip_id: tripOne,
      user_id: users.leader.id,
    });
    if (membership.role !== 'leader') throw new Error('Creator membership is not leader');
  });

  await check('valid, duplicate, cross-trip, and expired joins behave safely', async () => {
    if ((await join(clients.editor, inviteOne)) !== tripOne) throw new Error('Editor join returned wrong trip');
    if ((await join(clients.editor, inviteOne)) !== tripOne) throw new Error('Duplicate join did not return trip');
    if ((await join(clients.viewer, inviteOne)) !== tripOne) throw new Error('Viewer join failed');
    if ((await join(clients.editor, inviteTwo)) !== tripTwo) throw new Error('Second-trip join failed');

    const retryActivity = {
      trip_id: tripOne,
      user_id: users.editor.id,
      action_type: 'member_joined',
      module: 'collaboration',
      target_id: users.editor.id,
      description: 'Synthetic client retry activity',
    };
    const firstActivity = await clients.editor.from('activity_logs').insert(retryActivity);
    if (firstActivity.error) throw firstActivity.error;
    const secondActivity = await clients.editor.from('activity_logs').insert(retryActivity);
    if (secondActivity.error) throw secondActivity.error;

    await expectError(
      () => join(clients.outsider, expiredInvite),
      'Expired invite was accepted'
    );

    const duplicateCount = await countRows('group_members', {
      trip_id: tripOne,
      user_id: users.editor.id,
    });
    if (duplicateCount !== 1) throw new Error(`Expected one editor membership, received ${duplicateCount}`);
  });

  await check('safety profile CRUD is owner-only', async () => {
    const salt = crypto.randomBytes(16).toString('base64');
    const pin = '123456';
    const verifier = crypto
      .pbkdf2Sync(`${pin}:verify`, Buffer.from(salt, 'base64'), 310000, 32, 'sha256')
      .toString('base64');

    const inserted = await clients.leader.from('safety_profiles').insert({
      trip_id: tripOne,
      user_id: users.leader.id,
      full_name: 'Synthetic QA User',
      emergency_access_blob: 'v2$synthetic-local-envelope',
      emergency_access_pin_salt: salt,
      emergency_access_pin_hash: `pbkdf2_sha256$310000$${verifier}`,
    }).select('id').single();
    if (inserted.error) throw inserted.error;

    await expectNoRowsOrDenied(
      () => clients.editor.from('safety_profiles').select('id').eq('id', inserted.data.id),
      'Non-owner could read the safety profile'
    );

    const update = await clients.editor
      .from('safety_profiles')
      .update({ notes: 'unauthorized' })
      .eq('id', inserted.data.id)
      .select('id');
    const stored = await loadOne('safety_profiles', { id: inserted.data.id }, 'notes');
    if (stored.notes !== null) throw new Error('Non-owner changed the safety profile');

    const ownerRead = await clients.leader.from('safety_profiles').select('id').eq('id', inserted.data.id);
    if (ownerRead.error || ownerRead.data?.length !== 1) throw new Error('Owner could not read safety profile');
  });

  await check('emergency PIN RPC returns only the permitted envelope', async () => {
    const good = await clients.editor.rpc('get_emergency_access_profile', {
      p_trip_id: tripOne,
      p_target_user_id: users.leader.id,
      p_pin: '123456',
    });
    if (good.error) throw good.error;
    if (good.data?.length !== 1 || good.data[0].emergency_access_blob !== 'v2$synthetic-local-envelope') {
      throw new Error('Correct PIN did not return the emergency envelope');
    }
    if ('emergency_access_pin_hash' in good.data[0]) throw new Error('PIN verifier was exposed');

    const wrong = await clients.editor.rpc('get_emergency_access_profile', {
      p_trip_id: tripOne,
      p_target_user_id: users.leader.id,
      p_pin: '000000',
    });
    if (wrong.error) throw wrong.error;
    if (wrong.data?.length !== 0) throw new Error('Wrong PIN returned emergency data');

    const outsider = await clients.outsider.rpc('get_emergency_access_profile', {
      p_trip_id: tripOne,
      p_target_user_id: users.leader.id,
      p_pin: '123456',
    });
    if (outsider.error) throw outsider.error;
    if (outsider.data?.length !== 0) throw new Error('Non-member received emergency data');
  });

  await check('approval roles enforce module-scoped proposal permissions', async () => {
    const roleUpdate = await clients.leader
      .from('group_members')
      .update({ role: 'editor', module_permissions: ['budget'] })
      .eq('trip_id', tripOne)
      .eq('user_id', users.editor.id);
    if (roleUpdate.error) throw roleUpdate.error;

    const proposal = await clients.editor.from('change_proposals').insert({
      trip_id: tripOne,
      proposer_id: users.editor.id,
      module_id: 'budget',
      action_type: 'create',
      payload: { reason: 'synthetic local QA' },
      status: 'pending',
    }).select('id').single();
    if (proposal.error) throw proposal.error;

    await expectError(
      () =>
        clients.editor.from('change_proposals').insert({
          trip_id: tripOne,
          proposer_id: users.editor.id,
          module_id: 'travel',
          action_type: 'create',
          payload: { reason: 'synthetic local QA' },
          status: 'pending',
        }),
      'Editor could propose outside the assigned module'
    );

    await expectError(
      () =>
        clients.viewer.from('change_proposals').insert({
          trip_id: tripOne,
          proposer_id: users.viewer.id,
          module_id: 'budget',
          action_type: 'create',
          payload: { reason: 'synthetic local QA' },
          status: 'pending',
        }),
      'Viewer could create an approval proposal'
    );

    const editorResolve = await clients.editor
      .from('change_proposals')
      .update({
        status: 'approved',
        resolver_id: users.editor.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', proposal.data.id)
      .select('id');
    const stillPending = await loadOne('change_proposals', { id: proposal.data.id }, 'status');
    if (stillPending.status !== 'pending') throw new Error('Editor resolved a proposal');

    const leaderResolve = await clients.leader
      .from('change_proposals')
      .update({
        status: 'approved',
        resolver_id: users.leader.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', proposal.data.id)
      .select('id')
      .single();
    if (leaderResolve.error) throw leaderResolve.error;
  });

  await check('budget access is trip-scoped and scope changes are blocked', async () => {
    const inserted = await clients.editor.from('budget_entries').insert({
      trip_id: tripOne,
      paid_by: users.editor.id,
      amount_cents: 1234,
      description: 'Synthetic local QA expense',
      category: 'misc',
      split_type: 'equal',
    }).select('id').single();
    if (inserted.error) throw inserted.error;
    budgetFixtures.push({ id: inserted.data.id, client: clients.editor });

    await expectNoRowsOrDenied(
      () => clients.outsider.from('budget_entries').select('id').eq('id', inserted.data.id),
      'Outsider could read a budget entry'
    );
    await expectError(
      () =>
        clients.outsider.from('budget_entries').insert({
          trip_id: tripOne,
          paid_by: users.outsider.id,
          amount_cents: 100,
          description: 'Unauthorized',
          category: 'misc',
          split_type: 'equal',
        }),
      'Outsider could create a budget entry'
    );

    const scopeChange = await clients.editor
      .from('budget_entries')
      .update({ trip_id: tripTwo, paid_by: users.editor.id })
      .eq('id', inserted.data.id)
      .select('id');
    if (!scopeChange.error) throw new Error('Budget entry scope change was allowed');

    const stored = await loadOne('budget_entries', { id: inserted.data.id }, 'trip_id, paid_by');
    if (stored.trip_id !== tripOne || stored.paid_by !== users.editor.id) {
      throw new Error('Budget entry changed despite rejected scope update');
    }
  });

  await check('leadership transfer preserves one consistent leader', async () => {
    const transfer = await clients.leader.rpc('transfer_trip_leadership', {
      p_trip_id: tripOne,
      p_new_leader_id: users.editor.id,
    });
    if (transfer.error) throw transfer.error;
    if (transfer.data !== users.editor.id) throw new Error('Transfer returned the wrong leader');

    const trip = await loadOne('trips', { id: tripOne }, 'leader_id');
    const leaders = await countRows('group_members', { trip_id: tripOne, role: 'leader' });
    const membership = await loadOne('group_members', {
      trip_id: tripOne,
      user_id: users.editor.id,
    }, 'role');
    const activityCount = await countRows('activity_logs', {
      trip_id: tripOne,
      action_type: 'leadership_transferred',
    });
    if (trip.leader_id !== users.editor.id || leaders !== 1 || membership.role !== 'leader') {
      throw new Error('Leadership representations diverged');
    }
    if (activityCount !== 1) throw new Error(`Expected one transfer audit row, received ${activityCount}`);

    await expectError(
      () => clients.leader.rpc('transfer_trip_leadership', {
        p_trip_id: tripOne,
        p_new_leader_id: users.viewer.id,
      }),
      'Former leader could transfer leadership'
    );
    await expectError(
      () => clients.editor.rpc('transfer_trip_leadership', {
        p_trip_id: tripOne,
        p_new_leader_id: users.editor.id,
      }),
      'Leader could transfer leadership to self'
    );
  });

  const duplicateActivityCount = await countRows('activity_logs', {
    trip_id: tripOne,
    user_id: users.editor.id,
    action_type: 'member_joined',
  });
  if (duplicateActivityCount > 1) {
    recordWarning(
      'member_joined activity retry behavior',
      `Found ${duplicateActivityCount} records; membership is idempotent but activity logging is not.`
    );
  }

  if (results.some((result) => result.status === 'FAIL')) {
    throw new Error('Live authorization matrix failed');
  }
}

async function cleanup() {
  if (keepFixtures) {
    console.log('FESTNEST_KEEP_FIXTURES=1: synthetic fixtures were retained.');
    return;
  }

  for (const fixture of budgetFixtures) {
    const { error } = await fixture.client.from('budget_entries').delete().eq('id', fixture.id);
    if (error) console.warn(`Fixture budget cleanup failed: ${error.message}`);
  }
  if (tripIds.length) {
    const { error } = await admin.from('trips').delete().in('id', tripIds);
    if (error) console.warn(`Fixture trip cleanup failed: ${error.message}`);
  }
  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) console.warn(`Fixture auth cleanup failed: ${error.message}`);
    const { error: profileError } = await admin.from('users').delete().eq('id', userId);
    if (profileError) console.warn(`Fixture profile cleanup failed: ${profileError.message}`);
  }
}

try {
  await run();
} catch (error) {
  if (error?.message !== 'Live authorization matrix failed') {
    console.error(`Setup or matrix error: ${error?.message ?? error}`);
  }
  process.exitCode = 1;
} finally {
  await cleanup();
}

for (const result of results) {
  console.log(`${result.status === 'PASS' ? '✔' : '✖'} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
}
for (const warning of warnings) console.warn(`⚠ ${warning.name} — ${warning.detail}`);

const passCount = results.filter((result) => result.status === 'PASS').length;
const failCount = results.filter((result) => result.status === 'FAIL').length;
console.log(`Live matrix: ${passCount} passed, ${failCount} failed, ${warnings.length} warning(s)`);
