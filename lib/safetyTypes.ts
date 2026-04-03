/**
 * SafetyProfile Data Types
 * 
 * Privacy note: All fields except metadata are encrypted at rest.
 * Only the profile owner can decrypt and view their own data.
 */

export interface SafetyProfile {
  id: string;
  trip_id: string;
  user_id: string;
  
  // Personal Info (encrypted)
  full_name: string | null;
  phone: string | null;
  hometown: string | null;
  
  // Emergency Contact (encrypted)
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  
  // Allergies (encrypted arrays)
  allergies_food: string[] | null;
  allergies_environmental: string[] | null;
  allergies_medication: string[] | null;
  
  // Medical Info (encrypted)
  current_medications: string[] | null;
  blood_type: string | null;
  notes: string | null;
  
  // Metadata (not encrypted)
  created_at: string;
  updated_at: string;
}

/**
 * Encrypted SafetyProfile as stored in Supabase
 * All sensitive fields are encrypted strings
 */
export interface EncryptedSafetyProfile {
  id: string;
  trip_id: string;
  user_id: string;
  
  // All sensitive fields as encrypted base64 strings
  full_name: string | null;
  phone: string | null;
  hometown: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  allergies_food: string | null; // encrypted JSON array
  allergies_environmental: string | null; // encrypted JSON array
  allergies_medication: string | null; // encrypted JSON array
  current_medications: string | null; // encrypted JSON array
  blood_type: string | null;
  notes: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Form input for creating/editing safety profile
 */
export interface SafetyProfileFormData {
  full_name: string;
  phone: string;
  hometown: string;
  
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  
  allergies_food: string[];
  allergies_environmental: string[];
  allergies_medication: string[];
  
  current_medications: string[];
  blood_type: string;
  notes: string;
}

/**
 * Blood type options
 */
export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
] as const;

export type BloodType = typeof BLOOD_TYPES[number];
