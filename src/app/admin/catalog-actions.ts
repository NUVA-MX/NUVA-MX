'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { idleSyncState, type CatalogSyncState } from '@/lib/catalog/sync-state';
import { audit } from '@/server/audit/audit';
import { syncCatalog } from '@/server/catalog/run-sync';
import { currentContext } from '@/server/http/next-context';
import { log } from '@/server/log/logger';
import { enforceRateLimit } from '@/server/ratelimit/guard';

/*
 * Server actions are public HTTP endpoints, so the order is fixed: requireAdmin() first (redirects to the login
 * without a session, before any supplier call), then the adminWrite rate limit, then the sync (which has its own
 * window guard and run lock). Next.js checks the Origin header of server actions.
 */

/** "Sync now": runs the catalog sync once, if the supplier window is open and no other run is active. */
export async function syncCatalogAction(): Promise<CatalogSyncState> {
  const admin = await requireAdmin();
  const ctx = await currentContext();
  const limited = await enforceRateLimit('adminWrite', { adminId: admin.id });
  if (!limited.ok) {
    await audit({
      actorType: 'admin',
      actorId: admin.id,
      action: 'catalog.sync_rate_limited',
      target: 'innovation',
      outcome: 'denied',
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return { ...idleSyncState, status: 'rate_limited' };
  }
  try {
    const result = await syncCatalog('admin', { type: 'admin', id: admin.id, ip: ctx.ip, requestId: ctx.requestId });
    revalidatePath('/admin/catalogo');
    return result;
  } catch (err) {
    log.error('admin.catalog_sync_failed', { requestId: ctx.requestId, error: err });
    return { ...idleSyncState, status: 'failed', errorKind: 'unknown' };
  }
}
