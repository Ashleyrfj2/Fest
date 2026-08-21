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
  generateEmergencyPinSalt,
  hashEmergencyPin,
  encryptEmergencyAccessPayload,
  decryptEmergencyAccessPayload,
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

  const hasEmergencyAccessPin = Boolean(myProfile?.has_emergency_access_pin);

  type EmergencyAccessFields = Pick<
    EncryptedSafetyProfile,
    'emergency_access_blob' | 'emergency_access_pin_salt' | 'emergency_access_pin_hash'
  >;

  function hasCompleteEmergencyAccessFields(
    profile: Partial<EncryptedSafetyProfile> | null | undefined
  ): profile is Partial<EncryptedSafetyProfile> & {
    emergency_access_blob: string;
    emergency_access_pin_salt: string;
    emergency_access_pin_hash: string;
  } {
    return Boolean(
      profile?.emergency_access_blob &&
        profile?.emergency_access_pin_salt &&
        profile?.emergency_access_pin_hash
    );
  }

  function hasAnyEmergencyAccessField(
    profile: Partial<EncryptedSafetyProfile> | null | undefined
  ): boolean {
    return Boolean(
      profile?.emergency_access_blob ||
        profile?.emergency_access_pin_salt ||
        profile?.emergency_access_pin_hash
    );
  }

  function toEmergencyAccessFields(
    profile: Partial<EncryptedSafetyProfile>
  ): EmergencyAccessFields {
    return {
      emergency_access_blob: profile.emergency_access_blob ?? null,
      emergency_access_pin_salt: profile.emergency_access_pin_salt ?? null,
      emergency_access_pin_hash: profile.emergency_access_pin_hash ?? null,
    };
  }

  function getNewerProfile(
    a: Partial<EncryptedSafetyProfile>,
    b: Partial<EncryptedSafetyProfile>
  ): Partial<EncryptedSafetyProfile> {
    const aTime = Date.parse(a.updated_at || '');
    const bTime = Date.parse(b.updated_at || '');

    if (Number.isNaN(aTime)) return b;
    if (Number.isNaN(bTime)) return a;
    return bTime > aTime ? b : a;
  }

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

  async function getEncryptedProfileFromSupabase(
    userId: string
  ): Promise<EncryptedSafetyProfile | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from('safety_profiles')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return null;
        }
        throw fetchError;
      }

      return (data as EncryptedSafetyProfile) || null;
    } catch (err) {
      console.error('[SafetyProfile] Remote encrypted profile fetch failed:', err);
      return null;
    }
  }

  async function resolveEmergencyAccessFieldsForSave(
    localProfile: EncryptedSafetyProfile | null
  ): Promise<EmergencyAccessFields> {
    const remoteProfile = await getEncryptedProfileFromSupabase(userProfile!.id);
    const localHasComplete = hasCompleteEmergencyAccessFields(localProfile);
    const remoteHasComplete = hasCompleteEmergencyAccessFields(remoteProfile);
    const localHasAny = hasAnyEmergencyAccessField(localProfile);
    const remoteHasAny = hasAnyEmergencyAccessField(remoteProfile);

    if ((localHasAny && !localHasComplete) || (remoteHasAny && !remoteHasComplete)) {
      throw new Error(
        'Emergency PIN data is in an invalid state. Refresh and re-save your emergency PIN before editing your profile.'
      );
    }

    if (localHasComplete && remoteHasComplete) {
      const newer = getNewerProfile(localProfile!, remoteProfile!);
      return toEmergencyAccessFields(newer);
    }

    if (localHasComplete) {
      return toEmergencyAccessFields(localProfile!);
    }

    if (remoteHasComplete) {
      return toEmergencyAccessFields(remoteProfile!);
    }

    if (myProfile?.has_emergency_access_pin) {
      throw new Error(
        'Emergency PIN is enabled but encrypted PIN data is unavailable. Reconnect and refresh before saving profile changes.'
      );
    }

    return {
      emergency_access_blob: null,
      emergency_access_pin_salt: null,
      emergency_access_pin_hash: null,
    };
  }

  async function resolveOwnerEncryptedProfileForPinMutation(): Promise<EncryptedSafetyProfile> {
    if (!userProfile?.id) {
      throw new Error('User not authenticated');
    }

    const localProfile = (await getSafetyProfileLocal(
      tripId,
      userProfile.id
    )) as EncryptedSafetyProfile | null;

    if (localProfile) {
      return localProfile;
    }

    const remoteProfile = await getEncryptedProfileFromSupabase(userProfile.id);
    if (!remoteProfile) {
      throw new Error(
        'Unable to find a saved safety profile to update. Refresh and try again.'
      );
    }

    await saveSafetyProfileLocal(remoteProfile as any);
    await markSafetyProfileSynced(remoteProfile.id);
    return remoteProfile;
  }

  function isRemoteProfileNewer(
    localProfile: EncryptedSafetyProfile | null,
    remoteProfile: EncryptedSafetyProfile
  ): boolean {
    if (!localProfile) {
      return true;
    }

    return getNewerProfile(localProfile, remoteProfile) === remoteProfile;
  }

  async function verifyEmergencyPinAgainstProfile(
    encryptedProfile: EncryptedSafetyProfile,
    pin: string
  ): Promise<{
    blob: string;
    pinMatches: boolean;
    salt: string;
  }> {
    const salt = encryptedProfile.emergency_access_pin_salt;
    const storedHash = encryptedProfile.emergency_access_pin_hash;
    const blob = encryptedProfile.emergency_access_blob;

    if (!salt || !storedHash || !blob) {
      throw new Error('This member has not enabled emergency PIN access');
    }

    const enteredHash = await hashEmergencyPin(pin, salt);
    return {
      blob,
      pinMatches: enteredHash === storedHash,
      salt,
    };
  }

  function buildUnlockedSafetyProfile(
    encryptedProfile: EncryptedSafetyProfile,
    parsedPayload: Record<string, any>
  ): SafetyProfile {
    return {
      id: encryptedProfile.id,
      trip_id: encryptedProfile.trip_id,
      user_id: encryptedProfile.user_id,
      has_emergency_access_pin: true,
      full_name: parsedPayload.full_name ?? null,
      phone: parsedPayload.phone ?? null,
      hometown: parsedPayload.hometown ?? null,
      emergency_contact_name: parsedPayload.emergency_contact_name ?? null,
      emergency_contact_relationship: parsedPayload.emergency_contact_relationship ?? null,
      emergency_contact_phone: parsedPayload.emergency_contact_phone ?? null,
      allergies_food: parsedPayload.allergies_food ?? null,
      allergies_environmental: parsedPayload.allergies_environmental ?? null,
      allergies_medication: parsedPayload.allergies_medication ?? null,
      current_medications: parsedPayload.current_medications ?? null,
      blood_type: parsedPayload.blood_type ?? null,
      notes: parsedPayload.notes ?? null,
      created_at: encryptedProfile.created_at,
      updated_at: encryptedProfile.updated_at,
    };
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

      const existingEncrypted = (await getSafetyProfileLocal(
        tripId,
        userProfile.id
      )) as EncryptedSafetyProfile | null;
      const emergencyAccessFields = await resolveEmergencyAccessFieldsForSave(
        existingEncrypted
      );

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
        ...emergencyAccessFields,
        created_at: myProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to local DB immediately (offline-first)
      await saveSafetyProfileLocal(encrypted as any);

      // Update state with decrypted version
      const decrypted = await decryptProfile(encrypted as any, userProfile.id);
      setMyProfile(decrypted);

      // Background sync to Supabase
      // Normal profile edits must never mutate emergency PIN fields.
      syncToSupabase(encrypted, { includeEmergencyAccessFields: false });

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
  async function syncToSupabase(
    encrypted: EncryptedSafetyProfile,
    options?: { includeEmergencyAccessFields?: boolean }
  ) {
    try {
      const includeEmergencyAccessFields = options?.includeEmergencyAccessFields ?? true;
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
          ...(includeEmergencyAccessFields
            ? {
                emergency_access_blob: encrypted.emergency_access_blob,
                emergency_access_pin_salt: encrypted.emergency_access_pin_salt,
                emergency_access_pin_hash: encrypted.emergency_access_pin_hash,
              }
            : {}),
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
      has_emergency_access_pin: Boolean(encrypted.emergency_access_pin_hash),
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

  async function setEmergencyAccessPin(pin: string): Promise<void> {
    if (!userProfile?.id) {
      throw new Error('User not authenticated');
    }

    if (!/^\d{4,8}$/.test(pin)) {
      throw new Error('PIN must be 4-8 digits');
    }

    if (!myProfile) {
      throw new Error('Create and save your safety profile before setting a PIN');
    }

    const encryptedLocalProfile = await resolveOwnerEncryptedProfileForPinMutation();

    const emergencyPayload = {
      full_name: myProfile.full_name,
      phone: myProfile.phone,
      hometown: myProfile.hometown,
      emergency_contact_name: myProfile.emergency_contact_name,
      emergency_contact_relationship: myProfile.emergency_contact_relationship,
      emergency_contact_phone: myProfile.emergency_contact_phone,
      allergies_food: myProfile.allergies_food,
      allergies_environmental: myProfile.allergies_environmental,
      allergies_medication: myProfile.allergies_medication,
      current_medications: myProfile.current_medications,
      blood_type: myProfile.blood_type,
      notes: myProfile.notes,
    };

    const salt = await generateEmergencyPinSalt();
    const pinHash = await hashEmergencyPin(pin, salt);
    const emergencyBlob = await encryptEmergencyAccessPayload(
      JSON.stringify(emergencyPayload),
      pin,
      salt
    );

    const updatedEncryptedProfile: EncryptedSafetyProfile = {
      ...encryptedLocalProfile,
      emergency_access_blob: emergencyBlob,
      emergency_access_pin_salt: salt,
      emergency_access_pin_hash: pinHash,
      updated_at: new Date().toISOString(),
    };

    await saveSafetyProfileLocal(updatedEncryptedProfile as any);
    await syncToSupabase(updatedEncryptedProfile);

    setMyProfile((prev) => (prev ? { ...prev, has_emergency_access_pin: true } : prev));
  }

  async function clearEmergencyAccessPin(): Promise<void> {
    if (!userProfile?.id) {
      throw new Error('User not authenticated');
    }

    const encryptedLocalProfile = await resolveOwnerEncryptedProfileForPinMutation();

    const updatedEncryptedProfile: EncryptedSafetyProfile = {
      ...encryptedLocalProfile,
      emergency_access_blob: null,
      emergency_access_pin_salt: null,
      emergency_access_pin_hash: null,
      updated_at: new Date().toISOString(),
    };

    await saveSafetyProfileLocal(updatedEncryptedProfile as any);
    await syncToSupabase(updatedEncryptedProfile);

    setMyProfile((prev) => (prev ? { ...prev, has_emergency_access_pin: false } : prev));
  }

  async function unlockEmergencyProfile(targetUserId: string, pin: string): Promise<SafetyProfile> {
    if (!/^\d{4,8}$/.test(pin)) {
      throw new Error('PIN must be 4-8 digits');
    }

    let encryptedProfile = (await getSafetyProfileLocal(
      tripId,
      targetUserId
    )) as EncryptedSafetyProfile | null;

    if (!encryptedProfile) {
      const remoteProfile = await getEncryptedProfileFromSupabase(targetUserId);
      if (!remoteProfile) {
        throw new Error('No safety profile found for this member');
      }

      encryptedProfile = remoteProfile;
      await saveSafetyProfileLocal(remoteProfile as any);
      await markSafetyProfileSynced(remoteProfile.id);
    }

    let verification = await verifyEmergencyPinAgainstProfile(encryptedProfile, pin);

    if (!verification.pinMatches) {
      const remoteProfile = await getEncryptedProfileFromSupabase(targetUserId);

      if (remoteProfile && isRemoteProfileNewer(encryptedProfile, remoteProfile)) {
        await saveSafetyProfileLocal(remoteProfile as any);
        await markSafetyProfileSynced(remoteProfile.id);
        encryptedProfile = remoteProfile;
        verification = await verifyEmergencyPinAgainstProfile(encryptedProfile, pin);
      }

      if (!verification.pinMatches) {
        throw new Error('Incorrect emergency PIN');
      }
    }

    const decryptedPayload = await decryptEmergencyAccessPayload(
      verification.blob,
      pin,
      verification.salt
    );
    if (!decryptedPayload) {
      throw new Error('Unable to decrypt emergency data');
    }

    const parsed = JSON.parse(decryptedPayload);
    return buildUnlockedSafetyProfile(encryptedProfile, parsed);
  }

  return {
    myProfile,
    groupProfiles,
    loading,
    saving,
    error,
    hasEmergencyAccessPin,
    saveSafetyProfile,
    loadGroupProfiles,
    setEmergencyAccessPin,
    clearEmergencyAccessPin,
    unlockEmergencyProfile,
    refreshProfile: loadMyProfile,
  };
}
