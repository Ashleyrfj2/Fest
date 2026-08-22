import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateCategoryProgress,
  groupByCategory,
  mapSupplyCategoryToPackingCategory,
  PackingItemWithState,
} from '../lib/packingTypes';

function item(overrides: Partial<PackingItemWithState>): PackingItemWithState {
  return {
    id: 'item-1',
    trip_id: 'trip-1',
    user_id: 'user-1',
    name: 'Tent',
    category: 'shelter',
    quantity: 1,
    is_group_item: false,
    assigned_to: null,
    source_type: 'manual',
    source_supply_item_id: null,
    packed: false,
    created_at: '2026-08-21T00:00:00.000Z',
    updated_at: '2026-08-21T00:00:00.000Z',
    assignedToUser: null,
    ...overrides,
  };
}

test('malformed persisted categories do not crash packing summaries', () => {
  const malformed = item({ category: 'unexpected' as PackingItemWithState['category'] });
  const groups = groupByCategory([malformed]);

  assert.equal(groups.festival_gear.length, 1);
  assert.equal(
    calculateCategoryProgress([
      { ...malformed, packed: true },
    ]).find((progress) => progress.category === 'festival_gear')?.packed,
    1
  );
});

test('supply categories map into the packing workflow deterministically', () => {
  assert.equal(mapSupplyCategoryToPackingCategory('food'), 'kitchen');
  assert.equal(mapSupplyCategoryToPackingCategory('medical'), 'medical');
  assert.equal(mapSupplyCategoryToPackingCategory('misc'), 'festival_gear');
});
