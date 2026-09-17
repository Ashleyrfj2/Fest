import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { parseInviteCodeParam, parseTripIdParam } from '../lib/routing/routeParams';

const TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';

test('parses canonical trip path IDs and normalizes UUID casing', () => {
  assert.equal(parseTripIdParam(TRIP_ID.toUpperCase()), TRIP_ID);
});

test('rejects missing, repeated, whitespace, and non-UUID trip params', () => {
  assert.equal(parseTripIdParam(undefined), undefined);
  assert.equal(parseTripIdParam([TRIP_ID]), undefined);
  assert.equal(parseTripIdParam(` ${TRIP_ID}`), undefined);
  assert.equal(parseTripIdParam(`${TRIP_ID}/other`), undefined);
  assert.equal(parseTripIdParam('not-a-trip-id'), undefined);
});

test('rejects encoded and external-looking values instead of treating them as trip IDs', () => {
  assert.equal(parseTripIdParam('%2F' + TRIP_ID), undefined);
  assert.equal(parseTripIdParam('https://evil.example/' + TRIP_ID), undefined);
  assert.equal(parseTripIdParam('javascript:' + TRIP_ID), undefined);
});

test('accepts only canonical eight-character invite codes', () => {
  assert.equal(parseInviteCodeParam('EF26ABCD'), 'EF26ABCD');
  assert.equal(parseInviteCodeParam('1234ABCD'), '1234ABCD');
  assert.equal(parseInviteCodeParam('ef26abcd'), undefined);
  assert.equal(parseInviteCodeParam('EF26-ABCD'), undefined);
  assert.equal(parseInviteCodeParam(['EF26ABCD']), undefined);
  assert.equal(parseInviteCodeParam('EF26ABCD%2F'), undefined);
});

test('all trip screens validate the dynamic route parameter before data access', () => {
  const repoRoot = process.cwd();
  const tripScreens = [
    'app/trips/[id].tsx',
    'app/trips/[id]/budget.tsx',
    'app/trips/[id]/camp-grid.tsx',
    'app/trips/[id]/collaboration.tsx',
    'app/trips/[id]/food-planner.tsx',
    'app/trips/[id]/lineup.tsx',
    'app/trips/[id]/packing-checklist.tsx',
    'app/trips/[id]/safety-emergency.tsx',
    'app/trips/[id]/safety-profile.tsx',
    'app/trips/[id]/supply-list.tsx',
    'app/trips/[id]/travel.tsx',
  ];

  for (const relativePath of tripScreens) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /parseTripIdParam/);
    assert.match(source, /rawTripId/);
  }
});
