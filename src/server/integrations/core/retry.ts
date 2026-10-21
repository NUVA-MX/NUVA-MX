import 'server-only';
import type { HttpMethod } from './types';

export const MAX_RETRY_AFTER_MS = 10_000;
const IDEMPOTENT_METHODS: readonly HttpMethod[] = ['GET', 'HEAD', 'PUT', 'DELETE'];

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

/** POST/PATCH are only retried when the call carries an idempotency key. */
export function canRetryMethod(method: HttpMethod, hasIdempotencyKey: boolean): boolean {
  return IDEMPOTENT_METHODS.includes(method) || hasIdempotencyKey;
}

/** Exponential backoff with full jitter: random in [0, min(cap, base * 2^attempt)]. */
export function backoffMs(attempt: number, random: () => number, baseMs = 200, capMs = 5_000): number {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(random() * ceiling);
}

/** Parses Retry-After (delta-seconds or HTTP date) into milliseconds, or undefined. */
export function parseRetryAfter(value: string | null, nowMs: number): number | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (/^\d+$/.test(v)) return Number(v) * 1000;
  const date = Date.parse(v);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - nowMs);
}
