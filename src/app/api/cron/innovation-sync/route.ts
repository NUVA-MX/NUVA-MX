import { verifyCronBearer } from '@/server/catalog/cron-auth';
import { syncCatalog } from '@/server/catalog/run-sync';
import { audit } from '@/server/audit/audit';
import { cronSecret } from '@/server/env';
import { contextFromHeaders } from '@/server/http/request-context';
import { jsonError, jsonOk } from '@/server/http/responses';
import { log } from '@/server/log/logger';
import { enforceRateLimit } from '@/server/ratelimit/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** The sync has a 52 s budget (see run-sync.ts). */
export const maxDuration = 60;

/** Vercel Cron target. Only `Authorization: Bearer ${CRON_SECRET}` may run it; results carry counts only. */
export async function GET(request: Request): Promise<Response> {
  const ctx = contextFromHeaders(request.headers);
  const limited = await enforceRateLimit('cron', { ip: ctx.ip });
  if (!limited.ok) return limited.response;

  if (!verifyCronBearer(request.headers.get('authorization'), cronSecret())) {
    await audit({ actorType: 'system', action: 'catalog.sync_denied', target: 'innovation', outcome: 'denied', ip: ctx.ip, requestId: ctx.requestId });
    return jsonError(401, 'unauthorized');
  }

  try {
    const result = await syncCatalog('cron', { type: 'system', ip: ctx.ip, requestId: ctx.requestId });
    if (result.status === 'not_configured') return jsonError(404, 'not_found');
    const { status, accepted, rejected, deactivated } = result;
    return jsonOk({ status, accepted, rejected, deactivated });
  } catch (err) {
    log.error('api.cron.innovation_sync_error', { requestId: ctx.requestId, error: err });
    return jsonError(500, 'server_error');
  }
}
