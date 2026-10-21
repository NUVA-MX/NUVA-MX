import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetEnvCache } from '@/server/env';
import { IntegrationError } from '../errors';
import { createWithIdempotency, MemoryIdempotencyStore, setIdempotencyStoreForTests, withIdempotency } from '../idempotency';
import {
  computeSignature,
  getWebhookEventStore,
  MemoryWebhookEventStore,
  setWebhookEventStoreForTests,
  verifyHmacSignature,
} from '../webhooks';

const SECRET = 'w'.repeat(40);
const NOW = 1_700_000_000_000;
const ts = (offsetSec = 0) => String(Math.floor(NOW / 1000) + offsetSec);
const sign = (payload: string, timestamp: string, secret = SECRET) => computeSignature(secret, timestamp, payload);

describe('verifyHmacSignature', () => {
  const payload = '{"id":"evt_1"}';
  const base = { secret: SECRET, payload, nowMs: NOW };

  it('accepts a correct fresh signature (with optional prefix)', () => {
    const t = ts();
    expect(verifyHmacSignature({ ...base, timestamp: t, signature: sign(payload, t) })).toBe(true);
    expect(verifyHmacSignature({ ...base, timestamp: t, signature: `sha256=${sign(payload, t)}` })).toBe(true);
  });
  it('rejects wrong secret, tampered payload, bad/short/long/non-hex signature without throwing', () => {
    const t = ts();
    expect(verifyHmacSignature({ ...base, timestamp: t, signature: sign(payload, t, 'x'.repeat(40)) })).toBe(false);
    expect(verifyHmacSignature({ ...base, payload: payload + ' ', timestamp: t, signature: sign(payload, t) })).toBe(false);
    for (const sig of ['', 'abc', 'z'.repeat(64), sign(payload, t) + 'aa', sign(payload, t).slice(2), null, undefined]) {
      expect(verifyHmacSignature({ ...base, timestamp: t, signature: sig })).toBe(false);
    }
  });
  it('rejects a signature that does not cover the timestamp', () => {
    expect(verifyHmacSignature({ ...base, timestamp: ts(), signature: sign(payload, ts(1)) })).toBe(false);
  });
  it('rejects stale and future timestamps beyond tolerance, accepts the boundary', () => {
    for (const off of [-301, 301, -100000]) {
      const t = ts(off);
      expect(verifyHmacSignature({ ...base, timestamp: t, signature: sign(payload, t) })).toBe(false);
    }
    for (const off of [-300, 300]) {
      const t = ts(off);
      expect(verifyHmacSignature({ ...base, timestamp: t, signature: sign(payload, t) })).toBe(true);
    }
  });
  it('rejects missing or malformed timestamps', () => {
    expect(verifyHmacSignature({ ...base, timestamp: null, signature: 'a'.repeat(64) })).toBe(false);
    expect(verifyHmacSignature({ ...base, timestamp: 'abc', signature: sign(payload, 'abc') })).toBe(false);
  });
});

describe('MemoryWebhookEventStore', () => {
  it('claims once, releases for retry', async () => {
    const s = new MemoryWebhookEventStore();
    expect(await s.claim('example', 'e1')).toBe(true);
    expect(await s.claim('example', 'e1')).toBe(false);
    expect(await s.claim('other', 'e1')).toBe(true);
    await s.release('example', 'e1');
    expect(await s.claim('example', 'e1')).toBe(true);
  });
});

describe('withIdempotency', () => {
  const make = () => {
    let t = 0;
    const store = new MemoryIdempotencyStore(() => t);
    return { run: createWithIdempotency(store, { ttlMs: 1000, now: () => t }), advance: (ms: number) => void (t += ms) };
  };
  const err = async (p: Promise<unknown>) => {
    try {
      await p;
    } catch (e) {
      return (e as IntegrationError).kind;
    }
    return 'none';
  };

  it('runs once and replays the stored result', async () => {
    const { run } = make();
    let calls = 0;
    const fn = async () => ({ n: ++calls });
    expect(await run('s', 'k', 'h', fn)).toEqual({ n: 1 });
    expect(await run('s', 'k', 'h', fn)).toEqual({ n: 1 });
    expect(calls).toBe(1);
  });
  it('rejects same key with different payload hash', async () => {
    const { run } = make();
    await run('s', 'k', 'h1', async () => 1);
    expect(await err(run('s', 'k', 'h2', async () => 2))).toBe('idempotency_mismatch');
  });
  it('rejects a concurrent in-progress duplicate', async () => {
    const { run } = make();
    let release!: () => void;
    const first = run('s', 'k', 'h', () => new Promise<number>((r) => (release = () => r(1))));
    await Promise.resolve();
    expect(await err(run('s', 'k', 'h', async () => 2))).toBe('idempotency_in_progress');
    release();
    expect(await first).toBe(1);
  });
  it('allows a retry after a failure and after expiry', async () => {
    const { run, advance } = make();
    await expect(run('s', 'k', 'h', async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(await run('s', 'k', 'h', async () => 'ok')).toBe('ok');
    advance(1001);
    expect(await run('s', 'k', 'h', async () => 'again')).toBe('again');
  });
  it('scopes keys', async () => {
    const { run } = make();
    await run('a', 'k', 'h', async () => 1);
    expect(await run('b', 'k', 'h', async () => 2)).toBe(2);
  });
});

describe('B2/B3 regressions', () => {
  it('does not re-run fn when store.complete fails, returns the real result', async () => {
    class Flaky extends MemoryIdempotencyStore {
      async complete(): Promise<void> {
        throw new Error('db blip');
      }
    }
    const run = createWithIdempotency(new Flaky());
    let calls = 0;
    const fn = async () => ++calls;
    expect(await run('s', 'k', 'h', fn)).toBe(1);
    await expect(run('s', 'k', 'h', fn)).rejects.toMatchObject({ kind: 'idempotency_in_progress' });
    expect(calls).toBe(1);
  });

  it('webhook claims: processed stays duplicate, stale received is reclaimable', async () => {
    let t = 0;
    const s = new MemoryWebhookEventStore(() => t);
    expect(await s.claim('p', 'e')).toBe(true);
    t = 60_000;
    expect(await s.claim('p', 'e')).toBe(false);
    t = 5 * 60_000 + 1;
    expect(await s.claim('p', 'e')).toBe(true);
    await s.markProcessed('p', 'e');
    t = 10 * 60 * 60_000;
    expect(await s.claim('p', 'e')).toBe(false);
  });
});

describe('production without a database', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
    setWebhookEventStoreForTests(undefined);
    setIdempotencyStoreForTests(undefined);
  });
  const prodNoDb = () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', '');
    resetEnvCache();
  };

  it('webhook dedupe store refuses instead of falling back to per-instance memory', () => {
    prodNoDb();
    expect(() => getWebhookEventStore()).toThrow(expect.objectContaining({ kind: 'store_unavailable' }));
  });

  it('withIdempotency refuses and never runs the side effect', async () => {
    prodNoDb();
    let calls = 0;
    await expect(withIdempotency('pay', 'k1', 'h', async () => void calls++)).rejects.toMatchObject({ kind: 'store_unavailable' });
    expect(calls).toBe(0);
  });

  it('development without a database still uses the memory stores', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DATABASE_URL', '');
    resetEnvCache();
    expect(getWebhookEventStore()).toBeInstanceOf(MemoryWebhookEventStore);
    expect(await withIdempotency('pay', 'k1', 'h', async () => 'ok')).toBe('ok');
  });
});
