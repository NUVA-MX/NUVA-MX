import 'server-only';
import { contextFromHeaders } from '@/server/http/request-context';
import { jsonError } from '@/server/http/responses';
import { log } from '@/server/log/logger';
import { enforceRateLimit } from '@/server/ratelimit/guard';

/** Rate limit (policy `catalog`, per IP) shared by the public catalog routes. Null means "go on". */
export async function catalogGate(request: Request): Promise<{ response: Response | null; requestId: string }> {
  const ctx = contextFromHeaders(request.headers);
  const limited = await enforceRateLimit('catalog', { ip: ctx.ip });
  return { response: limited.ok ? null : limited.response, requestId: ctx.requestId };
}

/** Generic 500 for a failed read; details go to the log only. */
export function catalogFailure(event: string, requestId: string, error: unknown): Response {
  log.error(event, { requestId, error });
  return jsonError(500, 'server_error');
}
