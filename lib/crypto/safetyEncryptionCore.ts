const DEFAULT_ENCRYPTION_KEY_PREFIX = 'safety_profile_key_';
const KEY_SIZE_BYTES = 32;
const IV_SIZE_BYTES = 12;

export interface SafetyEncryptionKeyStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

export interface SafetyEncryptionDependencies {
  keyStore: SafetyEncryptionKeyStore;
  randomBytes(size: number): Promise<Uint8Array>;
  getSubtleCrypto(): SubtleCrypto;
  keyPrefix?: string;
  onError?: (message: string, error: unknown) => void;
}

export interface SafetyEncryptionService {
  getOrCreateEncryptionKey(userId: string): Promise<Uint8Array>;
  encryptString(plaintext: string | null | undefined, userId: string): Promise<string | null>;
  decryptString(ciphertext: string | null | undefined, userId: string): Promise<string | null>;
  encryptStringArray(values: string[] | null | undefined, userId: string): Promise<string | null>;
  decryptStringArray(ciphertext: string | null | undefined, userId: string): Promise<string[] | null>;
  deleteEncryptionKey(userId: string): Promise<void>;
}

export function createSafetyEncryptionService(
  dependencies: SafetyEncryptionDependencies
): SafetyEncryptionService {
  const keyPrefix = dependencies.keyPrefix ?? DEFAULT_ENCRYPTION_KEY_PREFIX;

  async function getOrCreateEncryptionKey(userId: string): Promise<Uint8Array> {
    const keyName = `${keyPrefix}${userId}`;
    const existingKey = await dependencies.keyStore.getItem(keyName);

    if (existingKey) {
      return base64ToUint8Array(existingKey);
    }

    const keyBytes = Uint8Array.from(await dependencies.randomBytes(KEY_SIZE_BYTES));
    await dependencies.keyStore.setItem(keyName, uint8ArrayToBase64(keyBytes));
    return keyBytes;
  }

  async function encryptString(
    plaintext: string | null | undefined,
    userId: string
  ): Promise<string | null> {
    if (!plaintext || plaintext.trim() === '') {
      return null;
    }

    try {
      const key = Uint8Array.from(await getOrCreateEncryptionKey(userId));
      const iv = Uint8Array.from(await dependencies.randomBytes(IV_SIZE_BYTES));
      const plaintextBytes = new TextEncoder().encode(plaintext);
      const subtle = dependencies.getSubtleCrypto();
      const cryptoKey = await subtle.importKey(
        'raw',
        uint8ArrayToArrayBuffer(key),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      const ciphertext = await subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        cryptoKey,
        plaintextBytes
      );
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);
      return uint8ArrayToBase64(combined);
    } catch (error) {
      dependencies.onError?.('[SafetyEncryption] Encryption failed:', error);
      throw new Error('Failed to encrypt safety data');
    }
  }

  async function decryptString(
    ciphertext: string | null | undefined,
    userId: string
  ): Promise<string | null> {
    if (!ciphertext || ciphertext.trim() === '') {
      return null;
    }

    try {
      const key = Uint8Array.from(await getOrCreateEncryptionKey(userId));
      const combined = base64ToUint8Array(ciphertext);

      if (combined.length <= IV_SIZE_BYTES) {
        return null;
      }

      const iv = combined.slice(0, IV_SIZE_BYTES);
      const encryptedData = combined.slice(IV_SIZE_BYTES);
      const subtle = dependencies.getSubtleCrypto();
      const cryptoKey = await subtle.importKey(
        'raw',
        uint8ArrayToArrayBuffer(key),
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      const plaintextBytes = await subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        cryptoKey,
        uint8ArrayToArrayBuffer(encryptedData)
      );
      return new TextDecoder().decode(plaintextBytes);
    } catch (error) {
      dependencies.onError?.(
        '[SafetyEncryption] Decryption failed (possible tampering):',
        error
      );
      return null;
    }
  }

  async function encryptStringArray(
    values: string[] | null | undefined,
    userId: string
  ): Promise<string | null> {
    if (!values || values.length === 0) {
      return null;
    }

    return encryptString(JSON.stringify(values), userId);
  }

  async function decryptStringArray(
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
      const parsed: unknown = JSON.parse(json);
      return Array.isArray(parsed) ? (parsed as string[]) : null;
    } catch {
      return null;
    }
  }

  async function deleteEncryptionKey(userId: string): Promise<void> {
    await dependencies.keyStore.deleteItem(`${keyPrefix}${userId}`);
  }

  return {
    getOrCreateEncryptionKey,
    encryptString,
    decryptString,
    encryptStringArray,
    decryptStringArray,
    deleteEncryptionKey,
  };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function uint8ArrayToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
