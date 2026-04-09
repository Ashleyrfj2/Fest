import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { SupplyItem } from '@/lib/supplyTypes';
import {
  PackingAssignedUser,
  PackingCategory,
  PackingItem,
  PackingItemInsert,
  PackingItemWithState,
  mapSupplyCategoryToPackingCategory,
} from '@/lib/packingTypes';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function createLocalPackingItemId() {
  const bytes = Crypto.getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export async function getPackingDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('festnest-packing.db');
  }

  return dbPromise;
}

export async function initPackingDb(): Promise<void> {
  const db = await getPackingDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS packing_items (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_supply_item_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      is_group_item INTEGER NOT NULL DEFAULT 0,
      assigned_to TEXT,
      packed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(trip_id, user_id, source_supply_item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_packing_items_trip_user
      ON packing_items(trip_id, user_id);

    CREATE INDEX IF NOT EXISTS idx_packing_items_source
      ON packing_items(source_supply_item_id);
  `);
}

export interface LocalPackingRow {
  id: string;
  trip_id: string;
  user_id: string;
  source_type: string;
  source_supply_item_id: string | null;
  name: string;
  category: PackingCategory;
  quantity: number;
  is_group_item: number | boolean;
  assigned_to: string | null;
  packed: number | boolean;
  created_at: string;
  updated_at: string;
}

function normalizePacked(value: number | boolean): boolean {
  return Boolean(value);
}

function toPackingItem(row: LocalPackingRow, assignees: PackingAssignedUser[]): PackingItemWithState {
  const assignedToUser = row.assigned_to
    ? assignees.find((assignee) => assignee.id === row.assigned_to) ?? null
    : null;

  return {
    id: row.id,
    trip_id: row.trip_id,
    user_id: row.user_id,
    source_type: row.source_type as PackingItem['source_type'],
    source_supply_item_id: row.source_supply_item_id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    is_group_item: Boolean(row.is_group_item),
    assigned_to: row.assigned_to,
    packed: normalizePacked(row.packed),
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignedToUser,
  };
}

async function fetchRows(tripId: string, userId: string): Promise<LocalPackingRow[]> {
  const db = await getPackingDb();
  return (await db.getAllAsync(
    `SELECT * FROM packing_items WHERE trip_id = ? AND user_id = ? ORDER BY created_at ASC`,
    [tripId, userId]
  )) as LocalPackingRow[];
}

export async function fetchPackingItems(
  tripId: string,
  userId: string,
  assignees: PackingAssignedUser[] = []
): Promise<PackingItemWithState[]> {
  const rows = await fetchRows(tripId, userId);
  return rows.map((row) => toPackingItem(row, assignees));
}

export async function seedStarterPackingItems(tripId: string, userId: string): Promise<number> {
  const db = await getPackingDb();
  const existing = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM packing_items WHERE trip_id = ? AND user_id = ?`,
    [tripId, userId]
  );

  if ((existing?.count ?? 0) > 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const starterTemplates: Array<{ name: string; category: PackingCategory; is_group_item?: boolean }> = [
    { name: 'Tent', category: 'shelter' },
    { name: 'Sleeping bag', category: 'shelter' },
    { name: 'Sleeping pad', category: 'shelter' },
    { name: 'Tarp / rain fly', category: 'shelter' },
    { name: 'Tent stakes', category: 'shelter' },
    { name: 'Mallet', category: 'shelter' },
    { name: 'Earplugs', category: 'festival_gear' },
    { name: 'Portable phone charger', category: 'festival_gear' },
    { name: 'Power bank', category: 'festival_gear' },
    { name: 'Headlamp', category: 'festival_gear' },
    { name: 'Fanny pack', category: 'festival_gear' },
    { name: 'Reusable cup', category: 'festival_gear' },
    { name: 'Rain poncho', category: 'clothing' },
    { name: 'Comfortable shoes', category: 'clothing' },
    { name: 'Layers for cold nights', category: 'clothing' },
    { name: 'Bandana', category: 'clothing' },
    { name: 'Hat / sun protection', category: 'clothing' },
    { name: 'Sunscreen', category: 'hygiene' },
    { name: 'Insect repellent', category: 'hygiene' },
    { name: 'Hand sanitizer', category: 'hygiene' },
    { name: 'Wet wipes', category: 'hygiene' },
    { name: 'Toothbrush + toothpaste', category: 'hygiene' },
    { name: 'Deodorant', category: 'hygiene' },
    { name: 'Personal medications', category: 'medical' },
    { name: 'Pain reliever', category: 'medical' },
    { name: 'Bandages / first aid', category: 'medical' },
    { name: 'Antidiarrheal', category: 'medical' },
    { name: 'Electrolyte packets', category: 'medical' },
    { name: 'Camp stove', category: 'kitchen', is_group_item: true },
    { name: 'Fuel canister', category: 'kitchen', is_group_item: true },
    { name: 'Cooking pot', category: 'kitchen', is_group_item: true },
    { name: 'Utensils', category: 'kitchen' },
    { name: 'Lighter', category: 'kitchen' },
    { name: 'Trash bags', category: 'kitchen' },
    { name: 'Camp chair', category: 'comfort' },
    { name: 'Blanket', category: 'comfort' },
    { name: 'Portable fan', category: 'comfort' },
    { name: 'Eye mask', category: 'comfort' },
    { name: 'Earplugs for sleep', category: 'comfort' },
  ];

  for (const template of starterTemplates) {
    await db.runAsync(
      `INSERT INTO packing_items (
        id, trip_id, user_id, source_type, source_supply_item_id,
        name, category, quantity, is_group_item, assigned_to, packed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createLocalPackingItemId(),
        tripId,
        userId,
        'starter',
        null,
        template.name,
        template.category,
        1,
        template.is_group_item ? 1 : 0,
        null,
        0,
        now,
        now,
      ]
    );
  }

  return starterTemplates.length;
}

export async function addPackingItem(
  item: PackingItemInsert,
  userId: string
): Promise<PackingItemWithState> {
  const db = await getPackingDb();
  const now = new Date().toISOString();
  const id = createLocalPackingItemId();

  await db.runAsync(
    `INSERT INTO packing_items (
      id, trip_id, user_id, source_type, source_supply_item_id,
      name, category, quantity, is_group_item, assigned_to, packed,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.trip_id,
      userId,
      item.source_type ?? 'manual',
      item.source_supply_item_id ?? null,
      item.name,
      item.category,
      item.quantity ?? 1,
      item.is_group_item ? 1 : 0,
      item.assigned_to ?? null,
      item.packed ? 1 : 0,
      now,
      now,
    ]
  );

  const row = await db.getFirstAsync<LocalPackingRow>('SELECT * FROM packing_items WHERE id = ?', [id]);
  if (!row) {
    throw new Error('Failed to save packing item');
  }

  return toPackingItem(row, []);
}

export async function updatePackingItem(
  itemId: string,
  updates: Partial<PackingItem>
): Promise<void> {
  const db = await getPackingDb();
  const now = new Date().toISOString();

  const columns: string[] = [];
  const values: Array<string | number | null> = [];

  const pushUpdate = (column: string, value: string | number | boolean | null | undefined) => {
    if (value === undefined) return;
    columns.push(`${column} = ?`);
    values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
  };

  pushUpdate('name', updates.name);
  pushUpdate('category', updates.category);
  pushUpdate('quantity', updates.quantity);
  pushUpdate('is_group_item', updates.is_group_item);
  pushUpdate('assigned_to', updates.assigned_to);
  pushUpdate('packed', updates.packed);
  pushUpdate('updated_at', now);

  if (!columns.length) return;

  await db.runAsync(`UPDATE packing_items SET ${columns.join(', ')} WHERE id = ?`, [...values, itemId]);
}

export async function deletePackingItem(itemId: string): Promise<void> {
  const db = await getPackingDb();
  await db.runAsync('DELETE FROM packing_items WHERE id = ?', [itemId]);
}

export async function getPackingItemById(itemId: string): Promise<LocalPackingRow | null> {
  const db = await getPackingDb();
  return (await db.getFirstAsync('SELECT * FROM packing_items WHERE id = ?', [itemId])) as LocalPackingRow | null;
}

export async function getPackingItemBySource(
  tripId: string,
  userId: string,
  sourceSupplyItemId: string
): Promise<LocalPackingRow | null> {
  const db = await getPackingDb();
  return (await db.getFirstAsync(
    `SELECT * FROM packing_items
     WHERE trip_id = ? AND user_id = ? AND source_type = 'supply' AND source_supply_item_id = ?`,
    [tripId, userId, sourceSupplyItemId]
  )) as LocalPackingRow | null;
}

export async function deletePackingItemBySource(
  tripId: string,
  userId: string,
  sourceSupplyItemId: string
): Promise<void> {
  const db = await getPackingDb();
  await db.runAsync(
    `DELETE FROM packing_items
     WHERE trip_id = ? AND user_id = ? AND source_type = 'supply' AND source_supply_item_id = ?`,
    [tripId, userId, sourceSupplyItemId]
  );
}

export async function syncPackingItemsFromSupplyItems(
  tripId: string,
  userId: string,
  supplyItems: SupplyItem[]
): Promise<void> {
  const db = await getPackingDb();
  const now = new Date().toISOString();
  const mirroredItems = supplyItems.filter((item) => item.claimed_by === userId);

  const existingMirrored = (await db.getAllAsync(
    `SELECT source_supply_item_id FROM packing_items
     WHERE trip_id = ? AND user_id = ? AND source_type = 'supply'`,
    [tripId, userId]
  )) as Array<{ source_supply_item_id: string | null }>;

  const mirroredIds = new Set(mirroredItems.map((item) => item.id));

  for (const supplyItem of mirroredItems) {
    const category = mapSupplyCategoryToPackingCategory(supplyItem.category);
    await db.runAsync(
      `INSERT INTO packing_items (
        id, trip_id, user_id, source_type, source_supply_item_id,
        name, category, quantity, is_group_item, assigned_to, packed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(trip_id, user_id, source_supply_item_id)
      DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        quantity = excluded.quantity,
        is_group_item = excluded.is_group_item,
        assigned_to = excluded.assigned_to,
        updated_at = excluded.updated_at`,
      [
        createLocalPackingItemId(),
        tripId,
        userId,
        'supply',
        supplyItem.id,
        supplyItem.name,
        category,
        supplyItem.quantity,
        0,
        userId,
        0,
        now,
        now,
      ]
    );
  }

  for (const row of existingMirrored) {
    const sourceSupplyItemId = row.source_supply_item_id;
    if (sourceSupplyItemId && !mirroredIds.has(sourceSupplyItemId)) {
      await db.runAsync(
        `DELETE FROM packing_items
         WHERE trip_id = ? AND user_id = ? AND source_type = 'supply' AND source_supply_item_id = ?`,
        [tripId, userId, sourceSupplyItemId]
      );
    }
  }
}

export async function syncPackingItemFromSupplyItem(
  tripId: string,
  userId: string,
  supplyItem: SupplyItem
): Promise<void> {
  await syncPackingItemsFromSupplyItems(tripId, userId, [supplyItem]);
}