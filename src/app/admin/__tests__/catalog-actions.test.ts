import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  enforceRateLimit: vi.fn(),
  audit: vi.fn(),
  syncCatalog: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({ requireAdmin: m.requireAdmin }));
vi.mock('next/cache', () => ({ revalidatePath: m.revalidatePath }));
vi.mock('@/server/audit/audit', () => ({ audit: m.audit }));
vi.mock('@/server/ratelimit/guard', () => ({ enforceRateLimit: m.enforceRateLimit }));
vi.mock('@/server/catalog/run-sync', () => ({ syncCatalog: m.syncCatalog }));
vi.mock('@/server/http/next-context', () => ({ currentContext: async () => ({ ip: '1.1.1.1', requestId: 'req-1' }) }));

import { syncCatalogAction } from '../catalog-actions';

describe('syncCatalogAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireAdmin.mockResolvedValue({ id: 'admin-1', email: 'a@nuva.mx' });
    m.enforceRateLimit.mockResolvedValue({ ok: true });
    m.syncCatalog.mockResolvedValue({ status: 'success', accepted: 3, rejected: 0, deactivated: 1 });
  });

  it('without a session it redirects before any supplier call (DoD-9)', async () => {
    m.requireAdmin.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(syncCatalogAction()).rejects.toThrow('NEXT_REDIRECT');
    expect(m.syncCatalog).not.toHaveBeenCalled();
    expect(m.enforceRateLimit).not.toHaveBeenCalled();
  });

  it('runs the sync for an admin and refreshes the admin page', async () => {
    expect(await syncCatalogAction()).toEqual({ status: 'success', accepted: 3, rejected: 0, deactivated: 1 });
    expect(m.syncCatalog).toHaveBeenCalledWith('admin', expect.objectContaining({ type: 'admin', id: 'admin-1' }));
    expect(m.revalidatePath).toHaveBeenCalledWith('/admin/catalogo');
  });

  it('is rate limited and audited without calling the supplier', async () => {
    m.enforceRateLimit.mockResolvedValue({ ok: false });
    expect((await syncCatalogAction()).status).toBe('rate_limited');
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'catalog.sync_rate_limited', outcome: 'denied' }));
    expect(m.syncCatalog).not.toHaveBeenCalled();
  });

  it('an unexpected error becomes a failed state without details', async () => {
    m.syncCatalog.mockRejectedValue(new Error('x'));
    expect(await syncCatalogAction()).toMatchObject({ status: 'failed', errorKind: 'unknown' });
  });
});
