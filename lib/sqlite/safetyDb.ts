/**
 * SafetyProfile SQLite Database for Offline Storage
 * 
 * CRITICAL: All sensitive fields are stored encrypted.
 * Keys are stored in device secure storage (Keychain/Keystore).
 * 
 * Sync strategy:
 * - Offline-first: Read from local DB, write to local DB
 * - Background sync: Push to Supabase when online
 * - Pull on trip join: Cache encrypted data locally for offline access
 */

import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getSafetyDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('festnest-safety.db');
  }
  return dbPromise;
}

export async function initSafetyDb(): Promise<void> {
  const db = await getSafetyDb();
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    
    -- SafetyProfiles stored with encrypted fields
    CREATE TABLE IF NOT EXISTS safety_profiles (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      
      -- Encrypted fields (stored as base64)
      full_name TEXT,
      phone TEXT,
      hometown TEXT,
      emergency_contact_name TEXT,
      emergency_contact_relationship TEXT,
      emergency_contact_phone TEXT,
      allergies_food TEXT,
      allergies_environmental TEXT,
      allergies_medication TEXT,
      current_medications TEXT,
      blood_type TEXT,
      notes TEXT,
      
      -- Metadata
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      
      -- Sync tracking
      needs_sync INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      
      UNIQUE(trip_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_safety_profiles_trip_id 
      ON safety_profiles(trip_id);
    
    CREATE INDEX IF NOT EXISTS idx_safety_profiles_user_id 
      ON safety_profiles(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_safety_profiles_needs_sync 
      ON safety_profiles(needs_sync) 
      WHERE needs_sync = 1;
  `);
}

/**
 * Save or update safety profile in local DB (already encrypted)
 */
export async function saveSafetyProfileLocal(profile: {
  id: string;
  trip_id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  hometown: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  allergies_food: string | null;
  allergies_environmental: string | null;
  allergies_medication: string | null;
  current_medications: string | null;
  blood_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): Promise<void> {
  const db = await getSafetyDb();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO safety_profiles (
      id, trip_id, user_id,
      full_name, phone, hometown,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
      allergies_food, allergies_environmental, allergies_medication,
      current_medications, blood_type, notes,
      created_at, updated_at, needs_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      profile.id,
      profile.trip_id,
      profile.user_id,
      profile.full_name,
      profile.phone,
      profile.hometown,
      profile.emergency_contact_name,
      profile.emergency_contact_relationship,
      profile.emergency_contact_phone,
      profile.allergies_food,
      profile.allergies_environmental,
      profile.allergies_medication,
      profile.current_medications,
      profile.blood_type,
      profile.notes,
      profile.created_at,
      profile.updated_at,
    ]
  );
}

/**
 * Get safety profile from local DB by trip and user
 */
export async function getSafetyProfileLocal(
  tripId: string,
  userId: string
): Promise<any | null> {
  const db = await getSafetyDb();
  
  const result = await db.getFirstAsync(
    `SELECT * FROM safety_profiles WHERE trip_id = ? AND user_id = ?`,
    [tripId, userId]
  );
  
  return result || null;
}

/**
 * Get all safety profiles for a trip (for group view)
 */
export async function getAllSafetyProfilesForTrip(
  tripId: string
): Promise<any[]> {
  const db = await getSafetyDb();
  
  const results = await db.getAllAsync(
    `SELECT * FROM safety_profiles WHERE trip_id = ? ORDER BY updated_at DESC`,
    [tripId]
  );
  
  return results as any[];
}

/**
 * Mark profile as synced
 */
export async function markSafetyProfileSynced(id: string): Promise<void> {
  const db = await getSafetyDb();
  
  await db.runAsync(
    `UPDATE safety_profiles 
     SET needs_sync = 0, last_synced_at = datetime('now') 
     WHERE id = ?`,
    [id]
  );
}

/**
 * Get profiles that need sync
 */
export async function getUnsyncedSafetyProfiles(): Promise<any[]> {
  const db = await getSafetyDb();
  
  const results = await db.getAllAsync(
    `SELECT * FROM safety_profiles WHERE needs_sync = 1`
  );
  
  return results as any[];
}

/**
 * Delete safety profile (local only - sync deletion separately)
 */
export async function deleteSafetyProfileLocal(
  tripId: string,
  userId: string
): Promise<void> {
  const db = await getSafetyDb();
  
  await db.runAsync(
    `DELETE FROM safety_profiles WHERE trip_id = ? AND user_id = ?`,
    [tripId, userId]
  );
}

/**
 * Clear all safety profiles (e.g., on logout or data wipe)
 */
export async function clearAllSafetyProfiles(): Promise<void> {
  const db = await getSafetyDb();
  await db.runAsync(`DELETE FROM safety_profiles`);
}
