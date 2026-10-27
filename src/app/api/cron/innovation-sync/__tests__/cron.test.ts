import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuditForTests } from '@/server/audit/audit';
import type { AuditEvent } from '@/server/audit/audit';
import { verifyCronBearer } from '@/server/catalog/cron-auth';
import { resetEnvCache } from '@/server/env';
import { resetRateLimitGuard } from '@/server/ratelimit/guard';

const sync = vi.hoisted(() => ({ syncCatalog: vi.fn() }));
vi.mock('@/server/catalog/run-sync', () => sync);

import { GET } from '../route';

const SECRET = 's3cret-'.padEnd(40, 'x');
const req = (authorization?: string, ip = '7.7.7.7') =>
  new Request('https://nuva.test/api/cron/innovation-sync', { headers: { 'x-real-ip': ip, ...(authorization ? { authorization } : {}) } });

describe('cron auth helper', () => {
  it('accepts only the exact bearer, in constant-time form', () => {
    expect(verifyCronBearer(`Bearer ${SECRET}`, SECRET)).toBe(true);
    expect(verifyCronBearer(`Bearer ${SECRET}x`, SECRET)).toBe(false);
    expect(verifyCronBearer('Bearer short', SECRET)).toBe(false);
    expect(verifyCronBearer(SECRET, SECRET)).toBe(false);
    expect(verifyCronBearer(null, SECRET)).toBe(false);
    expect(verifyCronBearer(`Bearer ${SECRET}`, undefined)).toBe(false);
  });
});

describe('GET /api/cron/innovation-sync', () => {
  const audits: AuditEvent[] = [];
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', SECRET);
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true');
    resetEnvCache();
    resetRateLimitGuard();
    audits.length = 0;
    setAuditForTests(async (e) => void audits.push(e));
    sync.syncCatalog.mockResolvedValue({ status: 'success', accepted: 5, rejected: 1, deactivated: 0 });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    resetEnvCache();
    resetRateLimitGuard();
    setAuditForTests(undefined);
  });

  it.each([
    ['no header', undefined],
    ['wrong bearer', 'Bearer nope'],
    ['bearer of a different length', `Bearer ${SECRET}extra`],
    ['not a bearer', `Basic ${SECRET}`],
  ])('%s -> 401, audited, no sync (DoD-9)', async (_n, header) => {
    const res = await GET(req(header));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
    expect(audits.at(-1)).toMatchObject({ action: 'catalog.sync_denied', outcome: 'denied' });
    expect(sync.syncCatalog).not.toHaveBeenCalled();
  });

  it('the right secret runs the sync and returns counts only', async () => {
    const res = await GET(req(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'success', accepted: 5, rejected: 1, deactivated: 0 });
    expect(sync.syncCatalog).toHaveBeenCalledWith('cron', expect.objectContaining({ type: 'system' }));
  });

  it('a disabled or unconfigured provider looks like a missing route', async () => {
    sync.syncCatalog.mockResolvedValue({ status: 'not_configured', accepted: 0, rejected: 0, deactivated: 0 });
    expect((await GET(req(`Bearer ${SECRET}`))).status).toBe(404);
  });

  it('an unexpected error is a generic 500', async () => {
    sync.syncCatalog.mockRejectedValue(new Error('boom with Clave=abc'));
    const res = await GET(req(`Bearer ${SECRET}`));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'server_error' });
  });

  it('the 11th call per minute and IP is 429, before authentication (DoD-9)', async () => {
    for (let i = 0; i < 10; i++) expect((await GET(req('Bearer nope', '6.6.6.6'))).status).toBe(401);
    const res = await GET(req(`Bearer ${SECRET}`, '6.6.6.6'));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });
});
