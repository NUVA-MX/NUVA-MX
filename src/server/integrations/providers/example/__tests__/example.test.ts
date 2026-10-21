import { describe, expect, it, vi } from 'vitest';
import { parseEnv, type Env } from '@/server/env';
import { createHttpClient } from '../../../core/http-client';
import { computeSignature } from '../../../core/webhooks';
import { createExampleClient } from '../client';
import { exampleProvider } from '../index';
import { verifyExampleWebhook } from '../webhook';

const SECRET = 'e'.repeat(40);
const NEXT_SECRET = 'n'.repeat(40);

export function envWith(extra: Record<string, string> = {}): Env {
  const r = parseEnv({
    INTEGRATION_EXAMPLE_ENABLED: 'true',
    INTEGRATION_EXAMPLE_API_KEY: 'api-key-abcdef',
    INTEGRATION_EXAMPLE_WEBHOOK_SECRET: SECRET,
    ...extra,
  });
  if (!r.ok) throw new Error(r.errors.join());
  return r.env;
}

describe('example client', () => {
  it('sends a Bearer key to the allowlisted host and validates both ways', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'p1', message: 'hi', receivedAt: '2026-01-01T00:00:00Z' }), { status: 200 }));
    const http = createHttpClient({ fetchImpl: fetchImpl as unknown as typeof fetch, audit: async () => {} });
    const client = createExampleClient({ http, env: envWith() });
    await expect(client.createPing({ message: 'hi' }, { idempotencyKey: 'k1' })).resolves.toMatchObject({ id: 'p1' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.test/v1/ping');
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer api-key-abcdef');
    expect(headers['idempotency-key']).toBe('k1');
    await expect(client.createPing({ message: '' })).rejects.toMatchObject({ kind: 'parse' });
  });

  it('rejects a malformed provider response', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"id":1}', { status: 200 }));
    const http = createHttpClient({ fetchImpl: fetchImpl as unknown as typeof fetch, audit: async () => {} });
    await expect(createExampleClient({ http, env: envWith() }).createPing({ message: 'x' })).rejects.toMatchObject({ kind: 'parse' });
  });

  it('is unavailable when disabled', () => {
    const r = parseEnv({});
    if (!r.ok) throw new Error();
    expect(exampleProvider.isEnabled(r.env)).toBe(false);
    expect(exampleProvider.isEnabled(envWith())).toBe(true);
  });
});

describe('example webhook verification', () => {
  const now = 1_700_000_000_000;
  const body = JSON.stringify({ id: 'evt_1', type: 'ping.created', data: { a: 1 } });
  const t = String(Math.floor(now / 1000));
  const headers = (sig: string, ts = t) => new Headers({ 'x-example-signature': sig, 'x-example-timestamp': ts });

  it('verifies with the current or the rotation secret', async () => {
    const env = envWith({ INTEGRATION_EXAMPLE_WEBHOOK_SECRET_NEXT: NEXT_SECRET });
    await expect(verifyExampleWebhook(body, headers(computeSignature(SECRET, t, body)), env, now)).resolves.toMatchObject({ id: 'evt_1', type: 'ping.created' });
    await expect(verifyExampleWebhook(body, headers(computeSignature(NEXT_SECRET, t, body)), env, now)).resolves.toMatchObject({ id: 'evt_1' });
  });
  it('maps failures to signature / replay / parse', async () => {
    const env = envWith();
    await expect(verifyExampleWebhook(body, new Headers(), env, now)).rejects.toMatchObject({ kind: 'signature' });
    await expect(verifyExampleWebhook(body, headers('0'.repeat(64)), env, now)).rejects.toMatchObject({ kind: 'signature' });
    const old = String(Math.floor(now / 1000) - 400);
    await expect(verifyExampleWebhook(body, headers(computeSignature(SECRET, old, body), old), env, now)).rejects.toMatchObject({ kind: 'replay' });
    const bad = 'not json';
    await expect(verifyExampleWebhook(bad, headers(computeSignature(SECRET, t, bad)), env, now)).rejects.toMatchObject({ kind: 'parse' });
  });
});
