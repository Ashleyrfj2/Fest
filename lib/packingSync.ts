import { SupplyItem } from './supplyTypes';

/**
 * Realtime payloads are treated as untrusted input even when the originating
 * query is filtered. Keep only the active trip and current owner before local
 * packing hydration or mirroring.
 */
export function selectClaimedSupplyItemsForPacking(
  supplyItems: SupplyItem[],
  tripId: string,
  userId: string
): SupplyItem[] {
  return supplyItems.filter(
    (item) => item.trip_id === tripId && item.claimed_by === userId
  );
}
