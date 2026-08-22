import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCampGridSaveBlockReason,
  shouldUseRemoteCampGridSnapshot,
} from '../lib/campGridSync';

test('remote camp grid wins only when it is newer or local state is absent', () => {
  assert.equal(shouldUseRemoteCampGridSnapshot(null, '2026-08-21T01:00:00Z'), true);
  assert.equal(
    shouldUseRemoteCampGridSnapshot('2026-08-21T01:00:00Z', '2026-08-21T02:00:00Z'),
    true
  );
  assert.equal(
    shouldUseRemoteCampGridSnapshot('2026-08-21T02:00:00Z', '2026-08-21T01:00:00Z'),
    false
  );
  assert.equal(
    shouldUseRemoteCampGridSnapshot('2026-08-21T02:00:00Z', 'not-a-date'),
    false
  );
});

test('camp grid blocks destructive saves when remote trust is missing', () => {
  assert.equal(
    getCampGridSaveBlockReason({
      deleteCount: 2,
      remoteLoadStatus: 'failed',
      localDataOrigin: 'default-created',
      allowDestructiveOverwrite: false,
    }),
    'destructive-overwrite-risk'
  );
  assert.equal(
    getCampGridSaveBlockReason({
      deleteCount: 2,
      remoteLoadStatus: 'success',
      localDataOrigin: 'existing-local',
      allowDestructiveOverwrite: false,
    }),
    'none'
  );
  assert.equal(
    getCampGridSaveBlockReason({
      deleteCount: 2,
      remoteLoadStatus: 'failed',
      localDataOrigin: 'default-created',
      allowDestructiveOverwrite: true,
    }),
    'none'
  );
});
