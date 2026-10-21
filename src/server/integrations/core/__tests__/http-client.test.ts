import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { AuditEvent } from '@/server/audit/audit';
import type { Logger } from '@/server/log/logger';
import { createBreakerRegistry } from '../circuit-breaker';
import { IntegrationError } from '../errors';
import { createHttpClient } from '../http-client';

const provider = { name: 'example', allowedHosts: ['api.example.test'] };
const schema = z.object({ ok: z.boolean() });
const URL_OK = 'https://api.example.test/v1/ping?secret=1';

function setup(responses: Array<Response | Error | ((init: RequestInit) => Promise<Response>)>, extra: { breakerThreshold?: number } = {}) {
  let t = 1_000_000;
  const sleeps: number[] = [];
  const audits: AuditEvent[] = [];
  const logs: Array<{ event: string; fields?: Record<string, unknown> }> = [];
  const log = {
    debug() {},
    info: (event: string, fields?: Record<string, unknown>) => void logs.push({ event, fields }),
    warn: (event: string, fields?: Record<string, unknown>) => void logs.push({ event, fields }),
    error: (event: string, fields?: Record<string, unknown>) => void logs.push({ event, fields }),
    child() {
      return log;
    },
  } as unknown as Logger;
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift() ?? new Response('{"ok":true}', { status: 200 });
    if (next instanceof Error) throw next;
    if (typeof next === 'function') return next(init ?? {});
    return next;
  }) as unknown as typeof fetch;
  const now = () => t;
  const client = createHttpClient({
    fetchImpl,
    now,
    sleep: async (ms) => {
      sleeps.push(ms);
      t += ms;
    },
    random: () => 0.5,
    breakers: createBreakerRegistry({ threshold: extra.breakerThreshold ?? 5, cooldownMs: 30_000, now }),
    audit: async (e) => void audits.push(e),
    log,
  });
  return { client, fetchImpl, calls, sleeps, audits, logs, advance: (ms: number) => void (t += ms) };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

const call = (client: ReturnType<typeof setup>['client'], o: Partial<Parameters<ReturnType<typeof setup>['client']['request']>[0]> = {}) =>
  client.request({ provider, method: 'GET', url: URL_OK, schema, ...o } as never);

async function kind(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (e instanceof IntegrationError) return e.kind;
    throw e;
  }
  return 'none';
}

describe('http-client: safety', () => {
  it('parses and returns typed data', async () => {
    const s = setup([json({ ok: true })]);
    await expect(call(s.client)).resolves.toEqual({ ok: true });
    expect(s.calls[0].init.redirect).toBe('manual');
  });

  it('refuses http, non-allowlisted hosts and IP literals without calling fetch', async () => {
    const s = setup([]);
    for (const url of [
      'http://api.example.test/x',
      'https://evil.com/x',
      'https://api.example.test.evil.com/x',
      'https://evil.com#api.example.test',
      'https://api.example.test@evil.com/',
      'https://10.0.0.1/',
    ]) {
      expect(await kind(call(s.client, { url }))).toBe('allowlist');
    }
    expect(s.fetchImpl).not.toHaveBeenCalled();
  });

  it('treats any 3xx as an error and never follows it', async () => {
    const s = setup([new Response(null, { status: 302, headers: { location: 'https://evil.com' } })]);
    expect(await kind(call(s.client))).toBe('http');
    expect(s.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects bodies over the cap (declared and streamed)', async () => {
    const big = 'x'.repeat(2000);
    const s1 = setup([new Response(big, { status: 200, headers: { 'content-length': '2000' } })]);
    expect(await kind(call(s1.client, { maxResponseBytes: 1000 }))).toBe('too_large');
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(big));
        c.close();
      },
    });
    const s2 = setup([new Response(stream, { status: 200 })]);
    expect(await kind(call(s2.client, { maxResponseBytes: 1000 }))).toBe('too_large');
  });

  it('reports parse errors for invalid JSON or schema mismatch', async () => {
    expect(await kind(call(setup([new Response('nope', { status: 200 })]).client))).toBe('parse');
    expect(await kind(call(setup([json({ ok: 'yes' })]).client))).toBe('parse');
  });

  it('times out at the configured deadline', async () => {
    const hang = (init: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    const s = setup([hang]);
    const started = Date.now();
    expect(await kind(call(s.client, { timeoutMs: 40, retries: 0 }))).toBe('timeout');
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('logs path without query string and never headers or bodies; audits failures', async () => {
    const s = setup([json({}, 500)]);
    await kind(call(s.client, { retries: 0, headers: { authorization: 'Bearer top-secret-key' }, method: 'POST', body: { card: '4242' } }));
    const all = JSON.stringify(s.logs) + JSON.stringify(s.audits);
    expect(all).not.toContain('top-secret-key');
    expect(all).not.toContain('4242');
    expect(all).not.toContain('secret=1');
    expect(s.logs[0].event).toBe('integration.call');
    expect(s.logs[0].fields).toMatchObject({ provider: 'example', method: 'POST', host: 'api.example.test', path: '/v1/ping', status: 500, attempt: 1 });
    expect(s.audits.some((a) => a.action === 'integration.call_failed' && a.outcome === 'failure')).toBe(true);
  });
});

describe('http-client: retries', () => {
  it('retries GET on 503 with backoff then succeeds (default 2 retries)', async () => {
    const s = setup([json({}, 503), json({}, 502), json({ ok: true })]);
    await expect(call(s.client)).resolves.toEqual({ ok: true });
    expect(s.fetchImpl).toHaveBeenCalledTimes(3);
    expect(s.sleeps).toEqual([100, 200]); // random 0.5 * (200, 400)
  });

  it('stays within the retry cap', async () => {
    const s = setup([json({}, 500), json({}, 500), json({}, 500), json({}, 500)]);
    expect(await kind(call(s.client))).toBe('http');
    expect(s.fetchImpl).toHaveBeenCalledTimes(3);
    const s2 = setup([json({}, 500), json({}, 500)]);
    await kind(call(s2.client, { retries: 1 }));
    expect(s2.fetchImpl).toHaveBeenCalledTimes(2);
    const s3 = setup(Array.from({ length: 10 }, () => json({}, 500)), { breakerThreshold: 100 });
    await kind(call(s3.client, { retries: 99 }));
    expect(s3.fetchImpl).toHaveBeenCalledTimes(6); // capped at 5 retries
  });

  it('never retries a POST without an idempotency key, even on 503 or network errors', async () => {
    const s = setup([json({}, 503)]);
    await kind(call(s.client, { method: 'POST', body: {} }));
    expect(s.fetchImpl).toHaveBeenCalledTimes(1);
    const s2 = setup([new TypeError('fetch failed')]);
    await kind(call(s2.client, { method: 'POST', body: {} }));
    expect(s2.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries a POST when an idempotency key is supplied and sends the header', async () => {
    const s = setup([json({}, 503), json({ ok: true })]);
    await call(s.client, { method: 'POST', body: { a: 1 }, idempotencyKey: 'k-1' });
    expect(s.fetchImpl).toHaveBeenCalledTimes(2);
    expect((s.calls[0].init.headers as Record<string, string>)['idempotency-key']).toBe('k-1');
    expect(s.calls[0].init.body).toBe('{"a":1}');
  });

  it('does not retry non-retryable statuses', async () => {
    for (const status of [400, 401, 404, 422]) {
      const s = setup([json({}, status)]);
      expect(await kind(call(s.client))).toBe('http');
      expect(s.fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  it('retries network errors for GET', async () => {
    const s = setup([new TypeError('fetch failed'), json({ ok: true })]);
    await expect(call(s.client)).resolves.toEqual({ ok: true });
  });

  it('honors Retry-After (seconds) up to 10s and gives up above it', async () => {
    const s = setup([json({}, 429, { 'retry-after': '3' }), json({ ok: true })]);
    await call(s.client);
    expect(s.sleeps).toEqual([3000]);
    const s2 = setup([json({}, 429, { 'retry-after': '60' }), json({ ok: true })]);
    expect(await kind(call(s2.client))).toBe('http');
    expect(s2.fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('http-client: circuit breaker', () => {
  it('opens after 5 consecutive failures, fails fast without fetch, probes once after cooldown, closes on success', async () => {
    const s = setup(Array.from({ length: 5 }, () => json({}, 500)));
    for (let i = 0; i < 5; i++) expect(await kind(call(s.client, { retries: 0 }))).toBe('http');
    expect(s.fetchImpl).toHaveBeenCalledTimes(5);
    expect(s.audits.some((a) => a.action === 'integration.circuit_open')).toBe(true);

    expect(await kind(call(s.client, { retries: 0 }))).toBe('circuit_open');
    expect(s.fetchImpl).toHaveBeenCalledTimes(5);

    s.advance(30_000);
    // Two concurrent calls after cooldown: exactly one probe reaches fetch.
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const probeFetch = vi.mocked(s.fetchImpl);
    probeFetch.mockImplementationOnce(async () => {
      await gate;
      return json({ ok: true });
    });
    const first = call(s.client, { retries: 0 });
    const second = await kind(call(s.client, { retries: 0 }));
    expect(second).toBe('circuit_open');
    release();
    await expect(first).resolves.toEqual({ ok: true });
    expect(s.fetchImpl).toHaveBeenCalledTimes(6);
    await expect(call(s.client)).resolves.toEqual({ ok: true }); // closed again
  });

  it('a successful call resets the failure streak; 4xx does not count', async () => {
    const s = setup([json({}, 500), json({}, 500), json({}, 404), json({}, 404), json({}, 404), json({}, 500), json({}, 500)], { breakerThreshold: 3 });
    for (let i = 0; i < 7; i++) await kind(call(s.client, { retries: 0 }));
    expect(s.fetchImpl).toHaveBeenCalledTimes(7);
  });
});
