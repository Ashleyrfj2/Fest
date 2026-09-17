/**
 * Invite System Utilities
 * Generate and validate invite codes for trip invitations
 */

import * as Crypto from 'expo-crypto';

/**
 * Generate a unique invite code
 * Format: 8 characters, uppercase alphanumeric (e.g. "EF26ABCD")
 */
export function generateInviteCode(): string {
  // Generate random bytes and convert to alphanumeric string
  const randomBytes = Crypto.getRandomBytes(8);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters[randomBytes[i] % characters.length];
  }

  return code;
}

/**
 * Generate shareable invite URL
 */
export function generateInviteUrl(code: string): string {
  // TODO: Replace with actual production domain
  const domain = __DEV__ ? 'localhost:8081' : 'festnest.app';
  const protocol = __DEV__ ? 'http' : 'https';

  return `${protocol}://${domain}/join/${code}`;
}

/**
 * Validate invite code format
 */
export function isValidInviteCode(code: string): boolean {
  // 8 characters, alphanumeric
  return /^[A-Z0-9]{8}$/.test(code);
}

/**
 * Check if invite has expired
 */
export function isInviteExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false; // null = permanent
  return new Date(expiresAt) < new Date();
}

/**
 * Generate invite expiry date
 * @param daysFromNow - Number of days until expiry (null = permanent)
 */
export function generateInviteExpiry(daysFromNow: number | null): string | null {
  if (daysFromNow === null) return null;

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + daysFromNow);
  return expiry.toISOString();
}
