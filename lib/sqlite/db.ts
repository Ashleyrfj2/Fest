import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getCampGridDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('festnest-camp-grid.db');
  }
  return dbPromise;
}

export async function initCampGridDb() {
  const db = await getCampGridDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS camp_grids (
      trip_id TEXT PRIMARY KEY NOT NULL,
      width_ft REAL NOT NULL,
      height_ft REAL NOT NULL,
      cell_size_ft REAL NOT NULL DEFAULT 1,
      measurement_unit TEXT NOT NULL DEFAULT 'ft',
      festival_preset TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS camp_items (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      label TEXT NOT NULL,
      color TEXT NOT NULL,
      x_ft REAL NOT NULL,
      y_ft REAL NOT NULL,
      width_ft REAL NOT NULL,
      height_ft REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_camp_items_trip_id ON camp_items(trip_id);
  `);
}
