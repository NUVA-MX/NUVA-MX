import 'server-only';
import type { Limiter, LimitResult } from './types';

const MAX_KEYS = 10_000;

/** In-process sliding-window (log) limiter. Per instance only: the fallback and the test implementation. */
export function createMemoryLimiter(opts: { limit: number; windowMs: number; now?: () => number }): Limiter {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();

  let lastPrune = 0;
  /** Bounded memory: at most one expiry sweep per second, then evict oldest keys (fails open for them). */
  function prune(t: number) {
    if (hits.size < MAX_KEYS) return;
    if (t - lastPrune >= 1000) {
      lastPrune = t;
      for (const [k, list] of hits) {
        if (list.length === 0 || list[list.length - 1] <= t - opts.windowMs) hits.delete(k);
      }
    }
    while (hits.size >= MAX_KEYS) {
      const oldest = hits.keys().next();
      if (oldest.done) break;
      hits.delete(oldest.value);
    }
  }

  return {
    async peek(key: string): Promise<LimitResult> {
      const t = now();
      const list = (hits.get(key) ?? []).filter((x) => x > t - opts.windowMs);
      if (list.length >= opts.limit) return { ok: false, remaining: 0, resetMs: Math.max(1, list[0] + opts.windowMs - t) };
      return { ok: true, remaining: opts.limit - list.length, resetMs: list.length ? list[0] + opts.windowMs - t : opts.windowMs };
    },
    async limit(key: string): Promise<LimitResult> {
      const t = now();
      prune(t);
      const list = (hits.get(key) ?? []).filter((x) => x > t - opts.windowMs);
      if (list.length >= opts.limit) {
        hits.delete(key);
        hits.set(key, list);
        return { ok: false, remaining: 0, resetMs: Math.max(1, list[0] + opts.windowMs - t) };
      }
      list.push(t);
      hits.delete(key);
      hits.set(key, list);
      return { ok: true, remaining: opts.limit - list.length, resetMs: list[0] + opts.windowMs - t };
    },
  };
}
