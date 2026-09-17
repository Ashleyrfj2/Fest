import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  getCampGridSaveBlockReason,
  shouldUseRemoteCampGridSnapshot,
} from '../lib/campGridSync';
import {
  chooseNewerSafetyProfile,
  isSafetyProfileInScope,
  shouldUseRemoteSafetyProfile,
} from '../lib/safetySync';
import { selectClaimedSupplyItemsForPacking } from '../lib/packingSync';
import { SyntheticRealtimeHarness } from './fixtures/realtimeHarness';
import { SupplyItem } from '../lib/supplyTypes';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function supplyFixture(overrides: Partial<SupplyItem>): SupplyItem {
  return {
    id: 'supply-a',
    trip_id: 'trip-a',
    name: 'Synthetic fuel',
    description: null,
    category: 'cooking',
    quantity: 1,
    claimed_by: 'user-a',
    status: 'claimed',
    created_by: 'user-a',
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
    claimedByUser: null,
    ...overrides,
  } as SupplyItem;
}

test('Camp Grid local-first arbitration handles hydration, stale data, malformed timestamps, and failed-load protection', () => {
  assert.equal(
    shouldUseRemoteCampGridSnapshot(null, '2026-08-21T02:00:00Z'),
    true,
    'a valid remote snapshot hydrates an empty local store'
  );
  assert.equal(
    shouldUseRemoteCampGridSnapshot('2026-08-21T03:00:00Z', '2026-08-21T02:00:00Z'),
    false,
    'an older remote snapshot cannot overwrite a newer local write'
  );
  assert.equal(
    shouldUseRemoteCampGridSnapshot('2026-08-21T03:00:00Z', 'not-a-date'),
    false,
    'malformed remote timestamps fail closed'
  );
  assert.equal(
    shouldUseRemoteCampGridSnapshot('also-not-a-date', 'not-a-date'),
    false,
    'two untrusted timestamps do not create a remote winner'
  );
  assert.equal(
    getCampGridSaveBlockReason({
      deleteCount: 3,
      remoteLoadStatus: 'failed',
      localDataOrigin: 'default-created',
      allowDestructiveOverwrite: false,
    }),
    'destructive-overwrite-risk'
  );
});

test('Safety arbitration preserves stale or malformed local PIN cache and rejects other scopes', () => {
  const local = {
    trip_id: 'trip-a',
    user_id: 'user-a',
    updated_at: '2026-08-21T03:00:00Z',
    emergency_access_pin_hash: 'local-pin-verifier',
  };
  const staleRemote = {
    ...local,
    updated_at: '2026-08-21T02:00:00Z',
    emergency_access_pin_hash: 'stale-remote-verifier',
  };

  assert.equal(chooseNewerSafetyProfile(local, staleRemote), local);
  assert.equal(
    shouldUseRemoteSafetyProfile(local.updated_at, 'not-a-date'),
    false,
    'malformed remote data cannot replace a usable local cache'
  );
  assert.equal(
    shouldUseRemoteSafetyProfile('not-a-date', '2026-08-21T04:00:00Z'),
    true,
    'a valid remote record can repair an untrusted local timestamp'
  );
  assert.equal(isSafetyProfileInScope(local, 'trip-a', 'user-a'), true);
  assert.equal(isSafetyProfileInScope(local, 'trip-b', 'user-a'), false);
  assert.equal(isSafetyProfileInScope(local, 'trip-a', 'user-b'), false);
});

test('Packing hydration accepts only claimed items from the active trip and user', () => {
  const selected = selectClaimedSupplyItemsForPacking(
    [
      supplyFixture({ id: 'active' }),
      supplyFixture({ id: 'other-trip', trip_id: 'trip-b' }),
      supplyFixture({ id: 'other-user', claimed_by: 'user-b' }),
      supplyFixture({ id: 'unclaimed', claimed_by: null, status: 'unassigned' }),
    ],
    'trip-a',
    'user-a'
  );

  assert.deepEqual(selected.map((item) => item.id), ['active']);
});

test('synthetic realtime delivery filters trips, survives reconnect, deduplicates storage, and cleans up', () => {
  type Row = { id: string; label: string };
  const realtime = new SyntheticRealtimeHarness<Row>();
  const rows = new Map<string, Row>();
  let activeEvents = 0;
  let otherTripEvents = 0;
  let hydrationCount = 0;

  const removeActive = realtime.subscribe({
    tripId: 'trip-a',
    onStatus: (status) => {
      if (status === 'SUBSCRIBED') hydrationCount += 1;
    },
    onEvent: (event) => {
      activeEvents += 1;
      rows.set(event.payload.id, event.payload);
    },
  });
  const removeOtherTrip = realtime.subscribe({
    tripId: 'trip-b',
    onEvent: () => {
      otherTripEvents += 1;
    },
  });

  assert.equal(hydrationCount, 1);
  assert.equal(realtime.activeSubscriptionCount, 2);

  const event = {
    eventId: 'event-1',
    tripId: 'trip-a',
    payload: { id: 'row-1', label: 'updated twice' },
  };
  realtime.emit(event);
  realtime.emit(event);
  realtime.emit({ ...event, eventId: 'event-other-trip', tripId: 'trip-b' });

  assert.equal(activeEvents, 2, 'duplicate delivery is observable and must be idempotent in storage');
  assert.equal(rows.size, 1);
  assert.equal(rows.get('row-1')?.label, 'updated twice');
  assert.equal(otherTripEvents, 1);

  realtime.disconnect();
  realtime.emit({ ...event, eventId: 'offline-event' });
  assert.equal(activeEvents, 2, 'events are not delivered while disconnected');
  realtime.reconnect();
  assert.equal(hydrationCount, 2, 'reconnect exposes a hydration callback');

  removeActive();
  assert.equal(realtime.activeSubscriptionCount, 1);
  realtime.emit({ ...event, eventId: 'after-unsubscribe' });
  assert.equal(activeEvents, 2, 'unsubscribed channels receive no further events');
  removeOtherTrip();
  assert.equal(realtime.activeSubscriptionCount, 0);
});

test('Camp Grid and Safety hooks expose local-first and scope guards', () => {
  const campGrid = readRepoFile('lib/sqlite/useCampGridDB.ts');
  const safety = readRepoFile('lib/hooks/useSafetyProfile.ts');

  assert.match(campGrid, /readLocalSnapshot\(tripId\)/);
  assert.match(campGrid, /readRemoteSnapshot\(/);
  assert.match(campGrid, /setRemoteLoadStatus\('failed'\)/);
  assert.match(campGrid, /getCampGridSaveBlockReason\(/);
  assert.match(campGrid, /\.eq\('trip_id', tripId\)/g);

  assert.match(safety, /getSafetyProfileLocal\(tripId, userProfile\.id\)/g);
  assert.match(safety, /shouldUseRemoteSafetyProfile\(/);
  assert.match(safety, /isSafetyProfileInScope\(data, tripId, userProfile\.id\)/);
  assert.match(safety, /\.eq\('trip_id', tripId\)/g);
  assert.match(safety, /\.eq\('user_id', userProfile\.id\)/g);
  assert.match(safety, /syncToSupabase\(localProfile/);
  assert.ok(
    safety.indexOf('await saveSafetyProfileLocal(encrypted as any)')
      < safety.indexOf('syncToSupabase(encrypted, { includeEmergencyAccessFields: false })'),
    'Safety writes to local storage before starting background remote sync'
  );
});

test('Packing and Travel subscriptions are scoped, reconnect-aware, and removable', () => {
  const packingHook = readRepoFile('lib/hooks/usePackingListLocal.ts');
  const packingDb = readRepoFile('lib/sqlite/packingDb.ts');
  const travelHook = readRepoFile('lib/hooks/useTravel.ts');

  assert.match(packingHook, /packing-sync:\$\{tripId\}:\$\{userProfile\.id\}/);
  assert.match(packingHook, /filter: `trip_id=eq\.\$\{tripId\}`/);
  assert.match(packingHook, /supabase\.removeChannel\(channel\)/);
  assert.match(packingDb, /selectClaimedSupplyItemsForPacking\(supplyItems, tripId, userId\)/);
  assert.match(packingDb, /WHERE id = \? AND trip_id = \? AND user_id = \?/g);
  assert.match(packingDb, /ON CONFLICT\(trip_id, user_id, source_supply_item_id\)/);

  assert.match(travelHook, /filter: `trip_id=eq\.\$\{tripId\}`/);
  assert.match(travelHook, /\.subscribe\(\(status\) =>/);
  assert.match(travelHook, /status === 'SUBSCRIBED'/);
  assert.match(travelHook, /void fetchData\(\)/);
  assert.match(travelHook, /supabase\.removeChannel\(travelChannel\)/);
});
