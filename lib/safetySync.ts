export interface TimestampedSafetyRecord {
  updated_at?: string | null;
}

/**
 * Select a remote safety record only when its timestamp is trustworthy and
 * newer than the local record. Equal timestamps keep the local copy so a
 * reconnect cannot replace an offline write with an equivalent snapshot.
 */
export function shouldUseRemoteSafetyProfile(
  localUpdatedAt: string | null | undefined,
  remoteUpdatedAt: string | null | undefined
): boolean {
  if (!remoteUpdatedAt) return false;

  const remoteTime = Date.parse(remoteUpdatedAt);
  if (Number.isNaN(remoteTime)) return false;
  if (!localUpdatedAt) return true;

  const localTime = Date.parse(localUpdatedAt);
  if (Number.isNaN(localTime)) return true;

  return remoteTime > localTime;
}

export function chooseNewerSafetyProfile<T extends TimestampedSafetyRecord>(
  localProfile: T,
  remoteProfile: T
): T {
  return shouldUseRemoteSafetyProfile(localProfile.updated_at, remoteProfile.updated_at)
    ? remoteProfile
    : localProfile;
}

export function isSafetyProfileInScope(
  profile: { trip_id?: unknown; user_id?: unknown } | null | undefined,
  tripId: string,
  userId: string
): boolean {
  return profile?.trip_id === tripId && profile?.user_id === userId;
}
