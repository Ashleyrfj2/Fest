export type CampGridRemoteLoadStatus = 'not-attempted' | 'loading' | 'success' | 'failed';
export type CampGridLocalDataOrigin = 'existing-local' | 'default-created' | 'remote-hydrated' | null;

/** Choose the newest trustworthy snapshot; invalid timestamps never beat valid local data. */
export function shouldUseRemoteCampGridSnapshot(
  localUpdatedAt: string | null | undefined,
  remoteUpdatedAt: string | null | undefined
): boolean {
  if (!localUpdatedAt) return true;
  if (!remoteUpdatedAt) return false;

  const remoteTime = Date.parse(remoteUpdatedAt);
  const localTime = Date.parse(localUpdatedAt);

  if (Number.isNaN(remoteTime)) return false;
  if (Number.isNaN(localTime)) return true;
  return remoteTime >= localTime;
}

export function getCampGridSaveBlockReason({
  deleteCount,
  remoteLoadStatus,
  localDataOrigin,
  allowDestructiveOverwrite,
}: {
  deleteCount: number;
  remoteLoadStatus: CampGridRemoteLoadStatus;
  localDataOrigin: CampGridLocalDataOrigin;
  allowDestructiveOverwrite: boolean;
}): 'none' | 'destructive-overwrite-risk' {
  if (
    deleteCount <= 0
    || allowDestructiveOverwrite
    || (remoteLoadStatus === 'success' && localDataOrigin !== 'default-created')
  ) {
    return 'none';
  }

  return 'destructive-overwrite-risk';
}
