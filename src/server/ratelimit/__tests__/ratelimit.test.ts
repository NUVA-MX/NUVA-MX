import { describe, expect, it } from 'vitest';
import { createRateLimitGuard } from '../guard';
import { createMemoryLimiter } from '../memory';
import type { Logger } from '@/server/log/logger';

function fakeLog() {
  const calls: Array<[string, string]> = [];
  const mk = (level: string) => (event: string) => void calls.push([level, event]);
  const log = { debug: mk('debug'), info: mk('info'), warn: mk('warn'), error: mk('error'), child: () => log } as unknown as Logger;
  return { log, calls };
}

describe('memory limiter (sliding window, fake clock)', () => {
  it('allows up to the limit then blocks, and frees slots as the window slides', async () => {
    let t = 1_000_000;
    const l = createMemoryLimiter({ limit: 3, windowMs: 60_000, now: () => t });
    expect((await l.limit('a')).ok).toBe(true);
    t += 10_000;
    expect((await l.limit('a')).ok).toBe(true);
    t += 10_000;
    const third = await l.limit('a');
    expect(third).toMatchObject({ ok: true, remaining: 0 });
    const blocked = await l.limit('a');
    expect(blocked.ok).toBe(false);
    expect(blocked.resetMs).toBe(40_000);
    expect((await l.limit('b')).ok).toBe(true);
    t += 40_001; // first hit slid out
    expect((await l.limit('a')).ok).toBe(true);
  });
});

describe('memory limiter bounds', () => {
  it('stays fast and bounded with many distinct keys', async () => {
    const t = 1_000_000;
    const l = createMemoryLimiter({ limit: 5, windowMs: 3_600_000, now: () => t });
    const start = Date.now();
    for (let i = 0; i < 50_000; i++) await l.limit(`k${i}`);
    expect(Date.now() - start).toBeLessThan(3000);
  });
});

describe('enforceRateLimit policies', () => {
  const newGuard = (extra = {}) => {
    let t = 5_000_000;
    const clock = { advance: (ms: number) => void (t += ms) };
    const { log, calls } = fakeLog();
    const guard = createRateLimitGuard({ now: () => t, log, ...extra });
    return { guard, clock, calls };
  };

  it('products: 61st request per minute per IP gets 429 + Retry-After + no-store', async () => {
    const { guard } = newGuard();
    for (let i = 0; i < 60; i++) expect((await guard('products', { ip: '1.1.1.1' })).ok).toBe(true);
    const r = await guard('products', { ip: '1.1.1.1' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(429);
      expect(r.response.headers.get('Retry-After')).toBe('60');
      expect(r.response.headers.get('Cache-Control')).toBe('no-store');
    }
    expect((await guard('products', { ip: '2.2.2.2' })).ok).toBe(true);
  });

  it('login: 6th attempt per minute per IP is blocked; window resets', async () => {
    const { guard, clock } = newGuard();
    for (let i = 0; i < 5; i++) expect((await guard('login', { ip: '1.1.1.1', emailHash: `h${i}` })).ok).toBe(true);
    expect((await guard('login', { ip: '1.1.1.1', emailHash: 'h9' })).ok).toBe(false);
    clock.advance(61_000);
    expect((await guard('login', { ip: '1.1.1.1', emailHash: 'h9' })).ok).toBe(true);
  });

  it('loginFailures: per-email hourly limit applies across IPs', async () => {
    const { guard, clock } = newGuard();
    for (let i = 0; i < 10; i++) {
      expect((await guard('loginFailures', { ip: `9.9.9.${i}`, emailHash: 'same' })).ok).toBe(true);
      clock.advance(1000);
    }
    expect((await guard.check('loginFailures', { emailHash: 'same' })).ok).toBe(false);
    expect((await guard.check('loginFailures', { emailHash: 'other' })).ok).toBe(true);
  });

  it('login IP rules no longer carry the per-email rule (successful logins never lock an email)', async () => {
    const { guard } = newGuard();
    for (let i = 0; i < 15; i++) {
      // Successful logins: only the IP policy is consumed, from many IPs.
      expect((await guard('login', { ip: `8.8.${i}.1`, emailHash: 'admin' })).ok).toBe(true);
    }
    expect((await guard.check('loginFailures', { emailHash: 'admin' })).ok).toBe(true);
  });

  it('check() never records a hit', async () => {
    const { guard } = newGuard();
    for (let i = 0; i < 50; i++) expect((await guard.check('loginFailures', { emailHash: 'x' })).ok).toBe(true);
    for (let i = 0; i < 10; i++) await guard('loginFailures', { emailHash: 'x' });
    const r = await guard.check('loginFailures', { emailHash: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(429);
  });

  it('buckets IPv6 by /64 and unifies IPv4-mapped addresses', async () => {
    const { guard } = newGuard();
    for (let i = 0; i < 60; i++) await guard('products', { ip: `2001:db8:1:2:${i}::1` });
    expect((await guard('products', { ip: '2001:db8:1:2:ffff::9' })).ok).toBe(false);
    for (let i = 0; i < 60; i++) await guard('products', { ip: i % 2 ? '::ffff:5.5.5.5' : '5.5.5.5' });
    expect((await guard('products', { ip: '5.5.5.5' })).ok).toBe(false);
  });

  it('webhook: 121st per minute per IP per provider; upload: 31st per admin', async () => {
    const { guard } = newGuard();
    for (let i = 0; i < 120; i++) expect((await guard('webhook', { ip: '1.1.1.1', provider: 'example' })).ok).toBe(true);
    expect((await guard('webhook', { ip: '1.1.1.1', provider: 'example' })).ok).toBe(false);
    expect((await guard('webhook', { ip: '1.1.1.1', provider: 'other' })).ok).toBe(true);
    for (let i = 0; i < 30; i++) expect((await guard('upload', { adminId: 'adm' })).ok).toBe(true);
    expect((await guard('upload', { adminId: 'adm' })).ok).toBe(false);
    expect((await guard('upload', { adminId: 'adm2' })).ok).toBe(true);
  });

  it('adminWrite: 61st write per minute per admin is blocked, other admins unaffected', async () => {
    const { guard, clock } = newGuard();
    for (let i = 0; i < 60; i++) expect((await guard('adminWrite', { adminId: 'a1' })).ok).toBe(true);
    const blocked = await guard('adminWrite', { adminId: 'a1' });
    expect(blocked.ok).toBe(false);
    expect((await guard('adminWrite', { adminId: 'a2' })).ok).toBe(true);
    // Without an admin id there is no key, so nothing is counted.
    expect((await guard('adminWrite', {})).ok).toBe(true);
    clock.advance(61_000);
    expect((await guard('adminWrite', { adminId: 'a1' })).ok).toBe(true);
  });

  it('login and upload IP limits skip the shared unknown bucket (S6)', async () => {
    const { guard } = newGuard();
    for (let i = 0; i < 30; i++) expect((await guard('login', { ip: 'unknown', emailHash: `h${i}` })).ok).toBe(true);
    for (let i = 0; i < 40; i++) expect((await guard('uploadIp', { ip: 'unknown' })).ok).toBe(true);
    for (let i = 0; i < 5; i++) await guard('login', { ip: '3.3.3.3' });
    expect((await guard('login', { ip: '3.3.3.3' })).ok).toBe(false);
  });

  it('logs a single fallback warning (error level in production)', async () => {
    const dev = newGuard();
    await dev.guard('products', { ip: '1.1.1.1' });
    await dev.guard('products', { ip: '1.1.1.1' });
    expect(dev.calls.filter((c) => c[1] === 'ratelimit.fallback_memory')).toEqual([['warn', 'ratelimit.fallback_memory']]);
    const prod = newGuard({ production: true });
    await prod.guard('products', { ip: '1.1.1.1' });
    expect(prod.calls).toContainEqual(['error', 'ratelimit.fallback_memory']);
  });

  it('a throwing shared backend falls back to memory and never throws', async () => {
    const { guard, calls } = newGuard({
      createPrimary: () => ({
        limit: async () => {
          throw new Error('upstash down');
        },
        peek: async () => {
          throw new Error('upstash down');
        },
      }),
    });
    for (let i = 0; i < 60; i++) expect((await guard('products', { ip: '1.1.1.1' })).ok).toBe(true);
    expect((await guard('products', { ip: '1.1.1.1' })).ok).toBe(false);
    expect(calls.some((c) => c[1] === 'ratelimit.backend_error')).toBe(true);
  });
});
