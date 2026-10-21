import { beforeEach, describe, expect, it } from 'vitest';
import type { AuditEvent } from '@/server/audit/audit';
import { parseEnv, type Env } from '@/server/env';
import { createRateLimitGuard } from '@/server/ratelimit/guard';
import { createRegistry } from '../core/registry';
import { IntegrationError } from '../core/errors';
import { computeSignature, MemoryWebhookEventStore } from '../core/webhooks';
import { createInboundHandler } from '../inbound';
import { exampleProvider } from '../providers/example';

const SECRET = 'e'.repeat(40);

function makeEnv(extra: Record<string, string | undefined> = {}): Env {
  const r = parseEnv({ INTEGRATION_EXAMPLE_ENABLED: 'true', INTEGRATION_EXAMPLE_API_KEY: 'k-abcdef123', INTEGRATION_EXAMPLE_WEBHOOK_SECRET: SECRET, ...extra });
  if (!r.ok) throw new Error(r.errors.join());
  return r.env;
}

let audits: AuditEvent[];
let store: MemoryWebhookEventStore;
let handled: string[];

function build(env: Env = makeEnv()) {
  audits = [];
  store = new MemoryWebhookEventStore();
  handled = [];
  const provider = { ...exampleProvider, webhook: { ...exampleProvider.webhook!, handle: async (e: { id: string }) => void handled.push(e.id) } };
  const guard = createRateLimitGuard({ log: { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as never });
  return createInboundHandler({
    registry: createRegistry([provider]),
    getEnv: () => env,
    store: () => store,
    audit: async (e) => void audits.push(e),
    enforceRateLimit: guard,
  });
}

const now = () => Math.floor(Date.now() / 1000);
function req(body: string, opts: { sig?: string; ts?: string; type?: string | null; headers?: Record<string, string> } = {}) {
  const ts = opts.ts ?? String(now());
  const headers: Record<string, string> = { 'x-real-ip': '1.2.3.4', ...opts.headers };
  if (opts.type !== null) headers['content-type'] = opts.type ?? 'application/json';
  if (opts.sig !== '') headers['x-example-signature'] = opts.sig ?? computeSignature(SECRET, ts, body);
  headers['x-example-timestamp'] = ts;
  return new Request('https://nuva.test/api/webhooks/example', { method: 'POST', body, headers });
}
const evt = (id = 'evt_1') => JSON.stringify({ id, type: 'ping.created', data: { x: 1 } });

describe('POST /api/webhooks/[provider] pipeline', () => {
  let handler: ReturnType<typeof build>;
  beforeEach(() => void (handler = build()));

  it('accepts a correctly signed fresh event and dispatches it', async () => {
    const res = await handler(req(evt()), 'example');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(handled).toEqual(['evt_1']);
  });

  it('401 (generic) for bad signature, missing header, stale and future timestamps; audited', async () => {
    const bodies = [];
    const b = evt('e2');
    const cases = [
      req(b, { sig: '0'.repeat(64) }),
      req(b, { sig: '' }),
      req(b, { ts: String(now() - 301) }),
      req(b, { ts: String(now() + 301) }),
    ];
    for (const r of cases) {
      const res = await handler(r, 'example');
      expect(res.status).toBe(401);
      bodies.push(await res.text());
    }
    expect(new Set(bodies).size).toBe(1);
    expect(handled).toEqual([]);
    expect(audits.filter((a) => a.action === 'webhook.rejected')).toHaveLength(4);
  });

  it('replayed event id returns 200 duplicate=true and is not reprocessed', async () => {
    await handler(req(evt('dup')), 'example');
    const res = await handler(req(evt('dup')), 'example');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ duplicate: true });
    expect(handled).toEqual(['dup']);
  });

  it('413 for bodies over 256 KB (declared and actual)', async () => {
    const big = JSON.stringify({ id: 'big', type: 't', data: { pad: 'x'.repeat(300 * 1024) } });
    expect((await handler(req(big), 'example')).status).toBe(413);
    const noLength = new Request('https://nuva.test/api/webhooks/example', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '1.2.3.4' },
      body: new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode('x'.repeat(300 * 1024)));
          c.close();
        },
      }),
      // @ts-expect-error node fetch requires duplex for streaming bodies
      duplex: 'half',
    });
    expect(noLength.headers.get('content-length')).toBeNull();
    expect((await handler(noLength, 'example')).status).toBe(413);
  });

  it('415 for non-JSON content types', async () => {
    expect((await handler(req(evt(), { type: 'text/plain' }), 'example')).status).toBe(415);
    expect((await handler(req(evt(), { type: null }), 'example')).status).toBe(415);
    expect((await handler(req(evt('ct'), { type: 'application/json; charset=utf-8' }), 'example')).status).toBe(200);
  });

  it('404 for unknown or disabled providers, identical bodies', async () => {
    const unknown = await handler(req(evt()), 'nope');
    const disabledHandler = build(makeEnv({ INTEGRATION_EXAMPLE_ENABLED: 'false' }));
    const disabled = await disabledHandler(req(evt()), 'example');
    expect(unknown.status).toBe(404);
    expect(disabled.status).toBe(404);
    expect(await unknown.text()).toBe(await disabled.text());
  });

  it('429 from the 121st request per minute per IP', async () => {
    for (let i = 0; i < 120; i++) expect((await handler(req(evt(`r${i}`)), 'example')).status).toBe(200);
    const res = await handler(req(evt('over')), 'example');
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('400 for a correctly signed body that fails the schema', async () => {
    const b = JSON.stringify({ nope: true });
    expect((await handler(req(b), 'example')).status).toBe(400);
  });

  it('releases the dedupe claim when the handler throws so a retry can succeed', async () => {
    audits = [];
    const failing = createInboundHandler({
      registry: createRegistry([{ ...exampleProvider, webhook: { ...exampleProvider.webhook!, handle: async () => { throw new Error('boom'); } } }]),
      getEnv: () => makeEnv(),
      store: () => store,
      audit: async () => {},
      enforceRateLimit: async () => ({ ok: true }),
    });
    expect((await failing(req(evt('f1')), 'example')).status).toBe(500);
    expect(await store.claim('example', 'f1')).toBe(true);
  });

  it('503 (not processed) when no shared dedupe store is available in production', async () => {
    const provider = { ...exampleProvider, webhook: { ...exampleProvider.webhook!, handle: async (e: { id: string }) => void handled.push(e.id) } };
    const h = createInboundHandler({
      registry: createRegistry([provider]),
      getEnv: () => makeEnv(),
      store: () => {
        throw new IntegrationError('store_unavailable', 'no db');
      },
      audit: async () => undefined,
      enforceRateLimit: async () => ({ ok: true }),
      log: { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as never,
    });
    handled = [];
    const res = await h(req(evt('evt_nodb')), 'example');
    expect(res.status).toBe(503);
    expect(handled).toEqual([]);
  });
});
