export type SyntheticRealtimeStatus = 'SUBSCRIBED' | 'CLOSED';

export interface SyntheticRealtimeEvent<T> {
  eventId: string;
  tripId: string;
  payload: T;
}

interface Subscription<T> {
  tripId: string;
  onEvent: (event: SyntheticRealtimeEvent<T>) => void;
  onStatus?: (status: SyntheticRealtimeStatus) => void;
}

/**
 * Tiny deterministic stand-in for a Supabase realtime channel. It models the
 * lifecycle and trip filter only; it deliberately does not pretend to model
 * network delivery guarantees or Postgres semantics.
 */
export class SyntheticRealtimeHarness<T> {
  private nextSubscriptionId = 1;
  private connected = true;
  private subscriptions = new Map<number, Subscription<T>>();

  subscribe(subscription: Subscription<T>): () => void {
    const id = this.nextSubscriptionId++;
    this.subscriptions.set(id, subscription);
    if (this.connected) subscription.onStatus?.('SUBSCRIBED');

    return () => {
      if (this.subscriptions.delete(id)) {
        subscription.onStatus?.('CLOSED');
      }
    };
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    for (const subscription of this.subscriptions.values()) {
      subscription.onStatus?.('CLOSED');
    }
  }

  reconnect(): void {
    if (this.connected) return;
    this.connected = true;
    for (const subscription of this.subscriptions.values()) {
      subscription.onStatus?.('SUBSCRIBED');
    }
  }

  emit(event: SyntheticRealtimeEvent<T>): void {
    if (!this.connected) return;

    for (const subscription of this.subscriptions.values()) {
      if (subscription.tripId === event.tripId) {
        subscription.onEvent(event);
      }
    }
  }

  get activeSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
