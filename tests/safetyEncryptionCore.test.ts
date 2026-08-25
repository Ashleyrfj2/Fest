import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import {
  createSafetyEncryptionService,
  type SafetyEncryptionKeyStore,
} from '../lib/crypto/safetyEncryptionCore';

function createHarness() {
  const storedKeys = new Map<string, string>();
  const keyStore: SafetyEncryptionKeyStore = {
    async getItem(key) {
      return storedKeys.get(key) ?? null;
    },
    async setItem(key, value) {
      storedKeys.set(key, value);
    },
    async deleteItem(key) {
      storedKeys.delete(key);
    },
  };
  const service = createSafetyEncryptionService({
    keyStore,
    async randomBytes(size) {
      return webcrypto.getRandomValues(new Uint8Array(size));
    },
    getSubtleCrypto() {
      return webcrypto.subtle as unknown as SubtleCrypto;
    },
  });

  return { service, storedKeys };
}

test('AES-GCM string encryption round-trips with a persisted per-user key', async () => {
  const { service, storedKeys } = createHarness();
  const plaintext = 'Synthetic safety profile';
  const first = await service.encryptString(plaintext, 'user-a');
  const second = await service.encryptString(plaintext, 'user-a');

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first, plaintext);
  assert.notEqual(first, second);
  assert.equal(await service.decryptString(first, 'user-a'), plaintext);
  assert.equal(storedKeys.size, 1);
});

test('string-array encryption preserves ordered string values', async () => {
  const { service } = createHarness();
  const values = ['Peanuts', 'Shellfish', 'Dairy'];
  const encrypted = await service.encryptStringArray(values, 'user-a');

  assert.ok(encrypted);
  assert.deepEqual(await service.decryptStringArray(encrypted, 'user-a'), values);
});

test('empty inputs return null without creating a key', async () => {
  const { service, storedKeys } = createHarness();

  assert.equal(await service.encryptString(null, 'user-a'), null);
  assert.equal(await service.encryptString('', 'user-a'), null);
  assert.equal(await service.encryptStringArray([], 'user-a'), null);
  assert.equal(await service.decryptString(null, 'user-a'), null);
  assert.equal(storedKeys.size, 0);
});

test('a different user key cannot decrypt another user ciphertext', async () => {
  const { service } = createHarness();
  const encrypted = await service.encryptString('Synthetic safety profile', 'user-a');

  assert.ok(encrypted);
  assert.equal(await service.decryptString(encrypted, 'user-b'), null);
});

test('AES-GCM authentication rejects tampered ciphertext', async () => {
  const { service } = createHarness();
  const encrypted = await service.encryptString('Synthetic safety profile', 'user-a');

  assert.ok(encrypted);
  const bytes = Uint8Array.from(atob(encrypted), (character) => character.charCodeAt(0));
  bytes[bytes.length - 1] ^= 1;
  const tampered = btoa(String.fromCharCode(...bytes));

  assert.equal(await service.decryptString(tampered, 'user-a'), null);
});

test('deleting a user key makes existing ciphertext unrecoverable', async () => {
  const { service } = createHarness();
  const encrypted = await service.encryptString('Synthetic safety profile', 'user-a');

  assert.ok(encrypted);
  await service.deleteEncryptionKey('user-a');
  assert.equal(await service.decryptString(encrypted, 'user-a'), null);
});
