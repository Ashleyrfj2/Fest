import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateExpenseSplits,
  calculateSettleUp,
  validateExpenseInput,
} from '../lib/budgetSettlements';
import { BudgetEntry } from '../lib/budgetTypes';

function entry(overrides: Partial<BudgetEntry>): BudgetEntry {
  return {
    id: 'expense-1',
    trip_id: 'trip-1',
    paid_by: 'alice',
    amount_cents: 1000,
    description: 'Fuel',
    category: 'fuel',
    split_type: 'equal',
    split_with: ['alice', 'bob'],
    custom_splits: null,
    created_at: '2026-08-21T00:00:00.000Z',
    ...overrides,
  };
}

test('equal splits preserve every cent by assigning remainder deterministically', () => {
  const splits = calculateExpenseSplits(
    entry({ amount_cents: 101, split_with: ['alice', 'bob', 'cara'] })
  );
  assert.deepEqual(splits.map((split) => split.amount_cents), [35, 33, 33]);
  assert.equal(splits.reduce((sum, split) => sum + split.amount_cents, 0), 101);
});

test('settlement recommendations do not overwrite rendered member balances', () => {
  const { balances, settlements } = calculateSettleUp([entry({})], ['alice', 'bob']);
  assert.equal(balances.get('alice')?.net_balance_cents, 500);
  assert.equal(balances.get('bob')?.net_balance_cents, -500);
  assert.deepEqual(settlements, [
    { from_user_id: 'bob', to_user_id: 'alice', amount_cents: 500 },
  ]);
});

test('rejects malformed custom splits that bypass the UI', () => {
  const common = {
    amountCents: 1000,
    splitWith: ['alice', 'bob'],
    splitType: 'custom' as const,
    currentUserId: 'alice',
  };

  assert.ok(validateExpenseInput({ ...common, customSplits: { alice: 1000, outsider: 0 } })?.includes('trip members'));
  assert.ok(validateExpenseInput({ ...common, customSplits: { alice: -1, bob: 1001 } })?.includes('non-negative'));
  assert.ok(validateExpenseInput({
    ...common,
    splitWith: ['alice', 'alice'],
    customSplits: { alice: 1000 },
  })?.includes('unique'));
  assert.equal(
    validateExpenseInput({ ...common, customSplits: { alice: 500, bob: 500 } }),
    null
  );
});
