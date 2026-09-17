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
import { createSafetyEncryptionService } from './safetyEncryptionCore';

const KEY_SIZE_BYTES = 32; // 256 bits for AES-256
const IV_SIZE_BYTES = 12; // 96 bits for GCM
const PIN_SALT_SIZE_BYTES = 16;
const EMERGENCY_PIN_KDF_ITERATIONS = 310000;
const EMERGENCY_PIN_HASH_PREFIX = 'pbkdf2_sha256';
const EMERGENCY_BLOB_VERSION = 'v2';
const LEGACY_EMERGENCY_BLOB_VERSION = 'legacy';

export type EmergencyPayloadFormat =
  | 'v2-pbkdf2'
  | 'legacy-sha256'
  | 'unversioned';

export interface DecryptedEmergencyPayload {
  plaintext: string;
  format: EmergencyPayloadFormat;
  needsReEncryption: boolean;
}

const safetyEncryption = createSafetyEncryptionService({
  keyStore: {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    deleteItem: (key) => SecureStore.deleteItemAsync(key),
  },
  randomBytes: async (size) => Uint8Array.from(await Crypto.getRandomBytesAsync(size)),
  getSubtleCrypto: () => crypto.subtle,
  onError: (message, error) => console.error(message, error),
});

/**
 * Securely generate or retrieve the user's encryption key
 * Keys are stored in the device's secure enclave (iOS Keychain / Android Keystore)
 */
export async function getOrCreateEncryptionKey(userId: string): Promise<Uint8Array> {
  return safetyEncryption.getOrCreateEncryptionKey(userId);
}

/**
 * Encrypt a string value using AES-256-GCM
 * Returns: base64(iv:ciphertext:authTag)
 */
export async function encryptString(
  plaintext: string | null | undefined,
  userId: string
): Promise<string | null> {
  return safetyEncryption.encryptString(plaintext, userId);
}

/**
 * Decrypt a string value using AES-256-GCM
 * Input format: base64(iv:ciphertext:authTag)
 */
export async function decryptString(
  ciphertext: string | null | undefined,
  userId: string
): Promise<string | null> {
  return safetyEncryption.decryptString(ciphertext, userId);
}

/**
 * Encrypt an array of strings
 */
export async function encryptStringArray(
  values: string[] | null | undefined,
  userId: string
): Promise<string | null> {
  return safetyEncryption.encryptStringArray(values, userId);
}

/**
 * Decrypt an array of strings
 */
export async function decryptStringArray(
  ciphertext: string | null | undefined,
  userId: string
): Promise<string[] | null> {
  return safetyEncryption.decryptStringArray(ciphertext, userId);
}

/**
 * Delete a user's encryption key (e.g., on account deletion)
 * DESTRUCTIVE: Cannot recover data after key deletion
 */
export async function deleteEncryptionKey(userId: string): Promise<void> {
  await safetyEncryption.deleteEncryptionKey(userId);
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
  // Version the new format so future key-derivation changes do not need to
  // guess which algorithm produced an otherwise opaque base64 blob.
  return `${EMERGENCY_BLOB_VERSION}$${uint8ArrayToBase64(combined)}`;
}

/**
 * Decrypt emergency payload with owner PIN.
 *
 * New payloads are explicitly marked v2 and use PBKDF2. Existing payloads
 * predate versioning and are tried with the legacy SHA-256-derived key first,
 * then the transitional unversioned PBKDF2 key used by the first hardening
 * release. AES-GCM authentication determines which interpretation is valid.
 */
export async function decryptEmergencyAccessPayload(
  blob: string,
  pin: string,
  salt: string
): Promise<string | null> {
  const result = await decryptEmergencyAccessPayloadDetailed(blob, pin, salt);
  return result?.plaintext ?? null;
}

/**
 * Decrypt an emergency payload and report whether it should be re-encrypted.
 * Re-encryption is intentionally explicit: callers must have the appropriate
 * owner write permission before replacing a legacy blob and verifier.
 */
export async function decryptEmergencyAccessPayloadDetailed(
  blob: string,
  pin: string,
  salt: string
): Promise<DecryptedEmergencyPayload | null> {
  const parsed = parseEmergencyBlob(blob);
  const candidateFormats: Array<'v2-pbkdf2' | 'legacy-sha256'> =
    parsed.format === 'v2-pbkdf2'
      ? ['v2-pbkdf2']
      : parsed.format === 'legacy-sha256'
        ? ['legacy-sha256']
        : ['legacy-sha256', 'v2-pbkdf2'];

  for (const format of candidateFormats) {
    try {
      const key =
        format === 'legacy-sha256'
          ? await deriveLegacyEmergencyPinKey(pin, salt)
          : await deriveEmergencyPinKey(pin, salt);
      const plaintext = await decryptEmergencyBlobBytes(parsed.encodedBlob, key);

      return {
        plaintext,
        format: parsed.format === 'unversioned' ? 'unversioned' : format,
        needsReEncryption: parsed.format !== 'v2-pbkdf2' || format !== 'v2-pbkdf2',
      };
    } catch {
      // An authentication failure means this candidate format was not the
      // format used to create the blob. Continue only for unversioned data.
    }
  }

  return null;
}

function parseEmergencyBlob(blob: string): {
  encodedBlob: string;
  format: EmergencyPayloadFormat;
} {
  if (blob.startsWith(`${EMERGENCY_BLOB_VERSION}$`)) {
    return {
      encodedBlob: blob.slice(`${EMERGENCY_BLOB_VERSION}$`.length),
      format: 'v2-pbkdf2',
    };
  }

  // This prefix is supported for fixtures and future exports. Existing
  // production legacy rows are unversioned raw base64 and are handled below.
  if (blob.startsWith(`${LEGACY_EMERGENCY_BLOB_VERSION}$`)) {
    return {
      encodedBlob: blob.slice(`${LEGACY_EMERGENCY_BLOB_VERSION}$`.length),
      format: 'legacy-sha256',
    };
  }

  return { encodedBlob: blob, format: 'unversioned' };
}

async function decryptEmergencyBlobBytes(
  encodedBlob: string,
  key: Uint8Array
): Promise<string> {
  const combined = base64ToUint8Array(encodedBlob);
  if (combined.length <= IV_SIZE_BYTES) {
    throw new Error('Invalid emergency payload');
  }

  const iv = combined.slice(0, IV_SIZE_BYTES);
  const encryptedData = combined.slice(IV_SIZE_BYTES);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    uint8ArrayToArrayBuffer(key),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const plaintextBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    uint8ArrayToArrayBuffer(encryptedData)
  );

  return new TextDecoder().decode(plaintextBytes);
}

async function deriveLegacyEmergencyPinKey(pin: string, salt: string): Promise<Uint8Array> {
  const digestHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  );
  return hexToUint8Array(digestHex);
}

function hexToUint8Array(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('Invalid SHA-256 digest');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
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
