import 'server-only';

export type BreakerState = 'closed' | 'open' | 'half_open';

export type CircuitBreaker = {
  /** True when a call may proceed. In half-open state exactly one probe is allowed at a time. */
  acquire(): boolean;
  recordSuccess(): void;
  /** Returns true when this failure opened the circuit. */
  recordFailure(): boolean;
  state(): BreakerState;
};

/** Per-provider, in-memory (per instance) breaker: opens after N consecutive failures. */
export function createCircuitBreaker(opts: { threshold?: number; cooldownMs?: number; now?: () => number } = {}): CircuitBreaker {
  const threshold = opts.threshold ?? 5;
  const cooldownMs = opts.cooldownMs ?? 30_000;
  const now = opts.now ?? Date.now;
  let state: BreakerState = 'closed';
  let failures = 0;
  let openedAt = 0;

  return {
    acquire() {
      if (state === 'closed') return true;
      if (state === 'open') {
        if (now() - openedAt >= cooldownMs) {
          state = 'half_open';
          return true; // this caller is the single probe
        }
        return false;
      }
      return false; // half_open: the probe is already in flight
    },
    recordSuccess() {
      state = 'closed';
      failures = 0;
    },
    recordFailure() {
      if (state === 'half_open') {
        state = 'open';
        openedAt = now();
        return true;
      }
      failures += 1;
      if (state === 'closed' && failures >= threshold) {
        state = 'open';
        openedAt = now();
        return true;
      }
      return false;
    },
    state: () => state,
  };
}

export type BreakerRegistry = { get(provider: string): CircuitBreaker };

export function createBreakerRegistry(opts: { threshold?: number; cooldownMs?: number; now?: () => number } = {}): BreakerRegistry {
  const map = new Map<string, CircuitBreaker>();
  return {
    get(provider) {
      let b = map.get(provider);
      if (!b) map.set(provider, (b = createCircuitBreaker(opts)));
      return b;
    },
  };
}
