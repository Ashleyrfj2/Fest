/**
 * SafetyProfile End-to-End Encryption
 * 
 * CRITICAL SECURITY MODULE
 * - Uses AES-256-GCM for authenticated encryption
 * - Per-user encryption keys stored in secure device storage
 * - Keys never leave the device, never sent to server
 * - Encrypted data format: base64(iv:ciphertext:authTag)
 * 
 * Security guarantees:
 * - Confidentiality: Only the user can decrypt their safety data
 * - Integrity: Tampering is detected via auth tag
 * - Offline-capable: Keys stored locally, works without network
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_PREFIX = 'safety_profile_key_';
const KEY_SIZE_BYTES = 32; // 256 bits for AES-256
const IV_SIZE_BYTES = 12; // 96 bits for GCM
const PIN_SALT_SIZE_BYTES = 16;
const EMERGENCY_PIN_KDF_ITERATIONS = 310000;
const EMERGENCY_PIN_HASH_PREFIX = 'pbkdf2_sha256';

/**
 * Securely generate or retrieve the user's encryption key
 * Keys are stored in the device's secure enclave (iOS Keychain / Android Keystore)
 */
export async function getOrCreateEncryptionKey(userId: string): Promise<Uint8Array> {
  const keyName = `${ENCRYPTION_KEY_PREFIX}${userId}`;
  
  // Try to retrieve existing key
  const existingKey = await SecureStore.getItemAsync(keyName);
  if (existingKey) {
    // Key exists, decode from base64
    return base64ToUint8Array(existingKey);
  }
  
  // Generate new key
  const keyBytes = await Crypto.getRandomBytesAsync(KEY_SIZE_BYTES);
  const keyBase64 = uint8ArrayToBase64(keyBytes);
  
  // Store in secure storage
  await SecureStore.setItemAsync(keyName, keyBase64);
  
  return keyBytes;
}

/**
 * Encrypt a string value using AES-256-GCM
 * Returns: base64(iv:ciphertext:authTag)
 */
export async function encryptString(
  plaintext: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!plaintext || plaintext.trim() === '') {
    return null;
  }
  
  try {
    const key = Uint8Array.from(await getOrCreateEncryptionKey(userId));
    const iv = Uint8Array.from(await Crypto.getRandomBytesAsync(IV_SIZE_BYTES));
    
    // Convert plaintext to bytes
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);
    
    // Use Web Crypto API for AES-GCM (available in React Native via polyfills)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      plaintextBytes
    );
    
    // Format: iv:ciphertext (ciphertext includes auth tag)
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    return uint8ArrayToBase64(combined);
  } catch (error) {
    console.error('[SafetyEncryption] Encryption failed:', error);
    throw new Error('Failed to encrypt safety data');
  }
}

/**
 * Decrypt a string value using AES-256-GCM
 * Input format: base64(iv:ciphertext:authTag)
 */
export async function decryptString(
  ciphertext: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!ciphertext || ciphertext.trim() === '') {
    return null;
  }
  
  try {
    const key = Uint8Array.from(await getOrCreateEncryptionKey(userId));
    const combined = base64ToUint8Array(ciphertext);
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_SIZE_BYTES);
    const encryptedData = Uint8Array.from(combined.slice(IV_SIZE_BYTES));
    
    // Use Web Crypto API for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const plaintextBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      encryptedData
    );
    
    // Convert bytes to string
    const decoder = new TextDecoder();
    return decoder.decode(plaintextBytes);
  } catch (error) {
    console.error('[SafetyEncryption] Decryption failed (possible tampering):', error);
    // Return null instead of throwing to handle corrupted data gracefully
    return null;
  }
}

/**
 * Encrypt an array of strings
 */
export async function encryptStringArray(
  values: string[] | null | undefined,
  userId: string
): Promise<string | null> {
  if (!values || values.length === 0) {
    return null;
  }
  
  // Serialize as JSON, then encrypt
  const json = JSON.stringify(values);
  return encryptString(json, userId);
}

/**
 * Decrypt an array of strings
 */
export async function decryptStringArray(
  ciphertext: string | null | undefined,
  userId: string
): Promise<string[] | null> {
  if (!ciphertext) {
    return null;
  }
  
  const json = await decryptString(ciphertext, userId);
  if (!json) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Delete a user's encryption key (e.g., on account deletion)
 * DESTRUCTIVE: Cannot recover data after key deletion
 */
export async function deleteEncryptionKey(userId: string): Promise<void> {
  const keyName = `${ENCRYPTION_KEY_PREFIX}${userId}`;
  await SecureStore.deleteItemAsync(keyName);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random salt for emergency PIN hashing and key derivation.
 */
export async function generateEmergencyPinSalt(): Promise<string> {
  const saltBytes = await Crypto.getRandomBytesAsync(PIN_SALT_SIZE_BYTES);
  return uint8ArrayToBase64(Uint8Array.from(saltBytes));
}

/**
 * Hash a PIN with salt for verification (stored server-side).
 */
export async function hashEmergencyPin(pin: string, salt: string): Promise<string> {
  const verifierBytes = await deriveEmergencyMaterial(pin, salt, 'verify');
  return `${EMERGENCY_PIN_HASH_PREFIX}$${EMERGENCY_PIN_KDF_ITERATIONS}$${uint8ArrayToBase64(
    verifierBytes
  )}`;
}

async function deriveEmergencyPinKey(pin: string, salt: string): Promise<Uint8Array> {
  return deriveEmergencyMaterial(pin, salt, 'encrypt');
}

export async function verifyEmergencyPinHash(
  pin: string,
  salt: string,
  storedHash: string
): Promise<boolean> {
  if (storedHash.startsWith(`${EMERGENCY_PIN_HASH_PREFIX}$`)) {
    const expectedHash = await hashEmergencyPin(pin, salt);
    return constantTimeEquals(expectedHash, storedHash);
  }

  // Backward compatibility for legacy SHA-256 hashes.
  const legacyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  );
  return constantTimeEquals(legacyHash, storedHash);
}

/**
 * Encrypt emergency payload that can be unlocked with owner PIN.
 */
export async function encryptEmergencyAccessPayload(
  payloadJson: string,
  pin: string,
  salt: string
): Promise<string> {
  const key = await deriveEmergencyPinKey(pin, salt);
  const keyBuffer = uint8ArrayToArrayBuffer(key);
  const iv = Uint8Array.from(await Crypto.getRandomBytesAsync(IV_SIZE_BYTES));
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(payloadJson);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    plaintextBytes
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return uint8ArrayToBase64(combined);
}

/**
 * Decrypt emergency payload with owner PIN.
 */
export async function decryptEmergencyAccessPayload(
  blob: string,
  pin: string,
  salt: string
): Promise<string | null> {
  try {
    const key = await deriveEmergencyPinKey(pin, salt);
    const keyBuffer = uint8ArrayToArrayBuffer(key);
    const combined = base64ToUint8Array(blob);
    const iv = combined.slice(0, IV_SIZE_BYTES);
    const encryptedData = combined.slice(IV_SIZE_BYTES);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plaintextBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      uint8ArrayToArrayBuffer(encryptedData)
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBytes);
  } catch {
    return null;
  }
}
function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Convert to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Use btoa for base64 encoding
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  // Decode base64 to binary string
  const binary = atob(base64);
  // Convert to Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function deriveEmergencyMaterial(
  pin: string,
  salt: string,
  context: 'encrypt' | 'verify'
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`${pin}:${context}`),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: uint8ArrayToArrayBuffer(base64ToUint8Array(salt)),
      iterations: EMERGENCY_PIN_KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_SIZE_BYTES * 8
  );

  return new Uint8Array(derivedBits);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
/**
 * Test encryption/decryption flow
 * Use for validation during development
 */
export async function testEncryption(userId: string): Promise<boolean> {
  try {
    const testData = 'Test safety data: allergies to peanuts';
    const encrypted = await encryptString(testData, userId);
    
    if (!encrypted) {
      console.error('[SafetyEncryption] Test failed: encryption returned null');
      return false;
    }
    
    const decrypted = await decryptString(encrypted, userId);
    
    if (decrypted !== testData) {
      console.error('[SafetyEncryption] Test failed: decrypted data mismatch');
      return false;
    }
    
    console.log('[SafetyEncryption] Test passed ✓');
    return true;
  } catch (error) {
    console.error('[SafetyEncryption] Test failed with error:', error);
    return false;
  }
}
