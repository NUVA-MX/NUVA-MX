import { describe, expect, it } from 'vitest';
import { createCircuitBreaker } from '../circuit-breaker';
import { backoffMs, canRetryMethod, isRetryableStatus, parseRetryAfter } from '../retry';

describe('retry helpers', () => {
  it('retryable statuses', () => {
    for (const s of [408, 429, 500, 502, 503, 504]) expect(isRetryableStatus(s)).toBe(true);
    for (const s of [200, 301, 400, 401, 403, 404, 409, 422]) expect(isRetryableStatus(s)).toBe(false);
  });
  it('retryable methods', () => {
    for (const m of ['GET', 'HEAD', 'PUT', 'DELETE'] as const) expect(canRetryMethod(m, false)).toBe(true);
    expect(canRetryMethod('POST', false)).toBe(false);
    expect(canRetryMethod('PATCH', false)).toBe(false);
    expect(canRetryMethod('POST', true)).toBe(true);
  });
  it('backoff uses full jitter and is capped', () => {
    expect(backoffMs(0, () => 0.999)).toBeLessThan(200);
    expect(backoffMs(2, () => 0.5)).toBe(400);
    expect(backoffMs(20, () => 0.999)).toBeLessThan(5000);
    expect(backoffMs(3, () => 0)).toBe(0);
  });
  it('parses Retry-After seconds and dates', () => {
    expect(parseRetryAfter('3', 0)).toBe(3000);
    expect(parseRetryAfter(null, 0)).toBeUndefined();
    expect(parseRetryAfter('garbage', 0)).toBeUndefined();
    expect(parseRetryAfter(new Date(10_000).toUTCString(), 4_000)).toBe(6000);
  });
});

describe('circuit breaker', () => {
  it('opens after N consecutive failures, single probe after cooldown, closes on success', () => {
    let t = 0;
    const b = createCircuitBreaker({ threshold: 3, cooldownMs: 30_000, now: () => t });
    expect(b.recordFailure()).toBe(false);
    b.recordSuccess(); // resets the streak
    expect(b.recordFailure()).toBe(false);
    expect(b.recordFailure()).toBe(false);
    expect(b.recordFailure()).toBe(true);
    expect(b.state()).toBe('open');
    expect(b.acquire()).toBe(false);
    t = 29_999;
    expect(b.acquire()).toBe(false);
    t = 30_000;
    expect(b.acquire()).toBe(true); // probe
    expect(b.acquire()).toBe(false); // only one
    expect(b.state()).toBe('half_open');
    b.recordSuccess();
    expect(b.state()).toBe('closed');
    expect(b.acquire()).toBe(true);
  });
  it('re-opens when the probe fails', () => {
    let t = 0;
    const b = createCircuitBreaker({ threshold: 1, cooldownMs: 1000, now: () => t });
    b.recordFailure();
    t = 1000;
    expect(b.acquire()).toBe(true);
    expect(b.recordFailure()).toBe(true);
    expect(b.acquire()).toBe(false);
    t = 1999;
    expect(b.acquire()).toBe(false);
    t = 2000;
    expect(b.acquire()).toBe(true);
  });
});
