import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canProposeForModule,
  validateProposalTripScope,
} from '../lib/approvalQueueValidation';

test('proposal UI permission mirrors leader/editor module access', () => {
  assert.equal(canProposeForModule('viewer', ['food'], 'food'), false);
  assert.equal(canProposeForModule('editor', ['food'], 'travel'), false);
  assert.equal(canProposeForModule('editor', ['food'], 'food'), true);
  assert.equal(canProposeForModule('editor', [], 'travel'), true);
  assert.equal(canProposeForModule('leader', ['food'], 'travel'), true);
  assert.equal(canProposeForModule(null, null, 'food'), false);
});

test('proposal creation rejects cross-trip and missing-trip scope', () => {
  assert.equal(validateProposalTripScope('trip-a', 'trip-a'), null);
  assert.match(
    validateProposalTripScope('trip-b', 'trip-a') ?? '',
    /does not match/
  );
  assert.match(
    validateProposalTripScope('', 'trip-a') ?? '',
    /valid active trip/
  );
});
