/**
 * useSafetyProfile Hook
 * 
 * Manages SafetyProfile CRUD with end-to-end encryption and offline-first sync.
 * 
 * Security model:
 * - All sensitive fields encrypted before storage
 * - Encryption keys stored in device secure storage
 * - Only profile owner can decrypt their own data
 * - Other trip members see encrypted data (read-only access)
 * 
 * Sync strategy:
 * - Writes go to local SQLite immediately (offline-first)
 * - Background sync pushes to Supabase when online
 * - Pull from Supabase on trip join for caching
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  SafetyProfile,
  EncryptedSafetyProfile,
  SafetyProfileFormData,
} from '@/lib/safetyTypes';
import {
  encryptString,
  decryptString,
  encryptStringArray,
  decryptStringArray,
} from '@/lib/crypto/safetyEncryption';
import {
  initSafetyDb,
  saveSafetyProfileLocal,
  getSafetyProfileLocal,
  getAllSafetyProfilesForTrip,
  markSafetyProfileSynced,
  getUnsyncedSafetyProfiles,
} from '@/lib/sqlite/safetyDb';

export function useSafetyProfile(tripId: string) {
  const { userProfile } = useAuth();
  const [myProfile, setMyProfile] = useState<SafetyProfile | null>(null);
  const [groupProfiles, setGroupProfiles] = useState<SafetyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize DB on mount
  useEffect(() => {
    initSafetyDb();
  }, []);

  // Load safety profile for current user
  useEffect(() => {
    if (!userProfile?.id || !tripId) {
      setLoading(false);
      return;
    }
    
    loadMyProfile();
  }, [userProfile?.id, tripId]);

  /**
   * Load current user's safety profile (decrypt it)
   */
  async function loadMyProfile() {
    if (!userProfile?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Try local DB first (offline-first)
      const localProfile = await getSafetyProfileLocal(tripId, userProfile.id);
      
      if (localProfile) {
        // Decrypt local profile
        const decrypted = await decryptProfile(localProfile, userProfile.id);
        setMyProfile(decrypted);
        setLoading(false);
        
        // Background sync from Supabase if online
        syncFromSupabase();
        return;
      }

      // No local cache, fetch from Supabase
      await syncFromSupabase();
    } catch (err) {
      console.error('[SafetyProfile] Load error:', err);
      setError('Failed to load safety profile');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Sync from Supabase (download encrypted data and decrypt)
   */
  async function syncFromSupabase() {
    if (!userProfile?.id) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('safety_profiles')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', userProfile.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = not found, which is OK
        throw fetchError;
      }

      if (data) {
        // Save encrypted data to local DB
        await saveSafetyProfileLocal(data as any);
        await markSafetyProfileSynced(data.id);
        
        // Decrypt and set state
        const decrypted = await decryptProfile(data as any, userProfile.id);
        setMyProfile(decrypted);
      }
    } catch (err) {
      console.error('[SafetyProfile] Sync error:', err);
      // Don't throw - offline mode should still work
    }
  }

  /**
   * Load all safety profiles for the trip (for group view)
   * Only the current user's profile will be decrypted
   */
  async function loadGroupProfiles() {
    if (!userProfile?.id) return;
    
    try {
      // Load from local DB
      const localProfiles = await getAllSafetyProfilesForTrip(tripId);
      
      // Decrypt only the current user's profile
      const decryptedProfiles = await Promise.all(
        localProfiles.map(async (profile) => {
          if (profile.user_id === userProfile.id) {
            return decryptProfile(profile, userProfile.id);
          } else {
            // Other users' profiles remain encrypted (we can't decrypt them)
            return {
              ...profile,
              full_name: '[Encrypted]',
              phone: '[Encrypted]',
              hometown: '[Encrypted]',
              emergency_contact_name: '[Encrypted]',
              emergency_contact_relationship: '[Encrypted]',
              emergency_contact_phone: '[Encrypted]',
              allergies_food: null,
              allergies_environmental: null,
              allergies_medication: null,
              current_medications: null,
              blood_type: '[Encrypted]',
              notes: '[Encrypted]',
            };
          }
        })
      );
      
      setGroupProfiles(decryptedProfiles);

      // Background sync from Supabase
      syncGroupProfilesFromSupabase();
    } catch (err) {
      console.error('[SafetyProfile] Load group profiles error:', err);
    }
  }

  /**
   * Sync all group profiles from Supabase
   */
  async function syncGroupProfilesFromSupabase() {
    try {
      const { data, error: fetchError } = await supabase
        .from('safety_profiles')
        .select('*')
        .eq('trip_id', tripId);

      if (fetchError) throw fetchError;

      if (data) {
        // Save all profiles to local DB (encrypted)
        for (const profile of data) {
          await saveSafetyProfileLocal(profile as any);
          await markSafetyProfileSynced(profile.id);
        }
        
        // Reload group profiles
        await loadGroupProfiles();
      }
    } catch (err) {
      console.error('[SafetyProfile] Sync group profiles error:', err);
    }
  }

  /**
   * Save or update safety profile
   */
  async function saveSafetyProfile(formData: SafetyProfileFormData) {
    if (!userProfile?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setSaving(true);
      setError(null);

      // Encrypt all sensitive fields
      const encrypted: EncryptedSafetyProfile = {
        id: myProfile?.id || crypto.randomUUID(),
        trip_id: tripId,
        user_id: userProfile.id,
        full_name: await encryptString(formData.full_name || null, userProfile.id),
        phone: await encryptString(formData.phone || null, userProfile.id),
        hometown: await encryptString(formData.hometown || null, userProfile.id),
        emergency_contact_name: await encryptString(
          formData.emergency_contact_name || null,
          userProfile.id
        ),
        emergency_contact_relationship: await encryptString(
          formData.emergency_contact_relationship || null,
          userProfile.id
        ),
        emergency_contact_phone: await encryptString(
          formData.emergency_contact_phone || null,
          userProfile.id
        ),
        allergies_food: await encryptStringArray(
          formData.allergies_food || null,
          userProfile.id
        ),
        allergies_environmental: await encryptStringArray(
          formData.allergies_environmental || null,
          userProfile.id
        ),
        allergies_medication: await encryptStringArray(
          formData.allergies_medication || null,
          userProfile.id
        ),
        current_medications: await encryptStringArray(
          formData.current_medications || null,
          userProfile.id
        ),
        blood_type: await encryptString(formData.blood_type || null, userProfile.id),
        notes: await encryptString(formData.notes || null, userProfile.id),
        created_at: myProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to local DB immediately (offline-first)
      await saveSafetyProfileLocal(encrypted as any);

      // Update state with decrypted version
      const decrypted = await decryptProfile(encrypted as any, userProfile.id);
      setMyProfile(decrypted);

      // Background sync to Supabase
      syncToSupabase(encrypted);

      return decrypted;
    } catch (err) {
      console.error('[SafetyProfile] Save error:', err);
      setError('Failed to save safety profile');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  /**
   * Sync encrypted profile to Supabase
   */
  async function syncToSupabase(encrypted: EncryptedSafetyProfile) {
    try {
      const { error: upsertError } = await supabase
        .from('safety_profiles')
        .upsert({
          id: encrypted.id,
          trip_id: encrypted.trip_id,
          user_id: encrypted.user_id,
          full_name: encrypted.full_name,
          phone: encrypted.phone,
          hometown: encrypted.hometown,
          emergency_contact_name: encrypted.emergency_contact_name,
          emergency_contact_relationship: encrypted.emergency_contact_relationship,
          emergency_contact_phone: encrypted.emergency_contact_phone,
          allergies_food: encrypted.allergies_food,
          allergies_environmental: encrypted.allergies_environmental,
          allergies_medication: encrypted.allergies_medication,
          current_medications: encrypted.current_medications,
          blood_type: encrypted.blood_type,
          notes: encrypted.notes,
          updated_at: encrypted.updated_at,
        });

      if (upsertError) throw upsertError;

      // Mark as synced
      await markSafetyProfileSynced(encrypted.id);
    } catch (err) {
      console.error('[SafetyProfile] Sync to Supabase error:', err);
      // Don't throw - offline writes should still succeed
    }
  }

  /**
   * Decrypt a profile (helper function)
   */
  async function decryptProfile(
    encrypted: any,
    userId: string
  ): Promise<SafetyProfile> {
    return {
      id: encrypted.id,
      trip_id: encrypted.trip_id,
      user_id: encrypted.user_id,
      full_name: await decryptString(encrypted.full_name, userId),
      phone: await decryptString(encrypted.phone, userId),
      hometown: await decryptString(encrypted.hometown, userId),
      emergency_contact_name: await decryptString(
        encrypted.emergency_contact_name,
        userId
      ),
      emergency_contact_relationship: await decryptString(
        encrypted.emergency_contact_relationship,
        userId
      ),
      emergency_contact_phone: await decryptString(
        encrypted.emergency_contact_phone,
        userId
      ),
      allergies_food: await decryptStringArray(encrypted.allergies_food, userId),
      allergies_environmental: await decryptStringArray(
        encrypted.allergies_environmental,
        userId
      ),
      allergies_medication: await decryptStringArray(
        encrypted.allergies_medication,
        userId
      ),
      current_medications: await decryptStringArray(
        encrypted.current_medications,
        userId
      ),
      blood_type: await decryptString(encrypted.blood_type, userId),
      notes: await decryptString(encrypted.notes, userId),
      created_at: encrypted.created_at,
      updated_at: encrypted.updated_at,
    };
  }

  return {
    myProfile,
    groupProfiles,
    loading,
    saving,
    error,
    saveSafetyProfile,
    loadGroupProfiles,
    refreshProfile: loadMyProfile,
  };
}
