import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, GET } from '@/app/api/webhooks/[provider]/route';
import { resetEnvCache } from '@/server/env';
import { setAuditForTests } from '@/server/audit/audit';
import { resetRateLimitGuard } from '@/server/ratelimit/guard';
import { computeSignature } from '../core/webhooks';
import { MemoryWebhookEventStore, setWebhookEventStoreForTests } from '../index';

const SECRET = 's'.repeat(40);
const ctx = (provider: string) => ({ params: Promise.resolve({ provider }) });

function signed(id: string, ts = String(Math.floor(Date.now() / 1000)), sig?: string) {
  const body = JSON.stringify({ id, type: 'ping.created', data: {} });
  return new Request('https://nuva.test/api/webhooks/example', {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      'x-real-ip': '8.8.8.8',
      'x-example-timestamp': ts,
      'x-example-signature': sig ?? computeSignature(SECRET, ts, body),
    },
  });
}

describe('route handler POST /api/webhooks/[provider] (real route, env from stubs)', () => {
  beforeEach(() => {
    vi.stubEnv('INTEGRATION_EXAMPLE_ENABLED', 'true');
    vi.stubEnv('INTEGRATION_EXAMPLE_API_KEY', 'key-abcdef-123');
    vi.stubEnv('INTEGRATION_EXAMPLE_WEBHOOK_SECRET', SECRET);
    vi.stubEnv('VERCEL_ENV', 'preview');
    resetEnvCache();
    resetRateLimitGuard();
    setWebhookEventStoreForTests(new MemoryWebhookEventStore());
    setAuditForTests(async () => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
    resetRateLimitGuard();
    setWebhookEventStoreForTests(undefined);
    setAuditForTests(undefined);
  });

  it('valid -> 200; replay -> duplicate; bad signature -> 401; unknown -> 404', async () => {
    expect((await POST(signed('a1'), ctx('example'))).status).toBe(200);
    const dup = await POST(signed('a1'), ctx('example'));
    expect(await dup.json()).toEqual({ duplicate: true });
    expect((await POST(signed('a2', undefined, '0'.repeat(64)), ctx('example'))).status).toBe(401);
    expect((await POST(signed('a3'), ctx('stripe'))).status).toBe(404);
    expect((await GET()).status).toBe(404);
  });

  it('disabled provider -> 404', async () => {
    vi.stubEnv('INTEGRATION_EXAMPLE_ENABLED', 'false');
    resetEnvCache();
    expect((await POST(signed('b1'), ctx('example'))).status).toBe(404);
  });

  it('example provider enabled in production is a boot error (getEnv throws, route answers 500 not 200)', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    resetEnvCache();
    expect((await POST(signed('c1'), ctx('example'))).status).toBe(500);
  });
});
