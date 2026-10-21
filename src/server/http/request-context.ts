import 'server-only';
import { randomUUID } from 'node:crypto';
import { getClientIp } from './client-ip';

export type RequestContext = { requestId: string; ip: string };

/** x-vercel-id when present (trimmed to a sane length), otherwise a random UUID. */
export function getRequestId(headers: Headers): string {
  const id = headers.get('x-vercel-id')?.trim();
  return id && id.length <= 128 && /^[A-Za-z0-9:_-]+$/.test(id) ? id : randomUUID();
}

export function contextFromHeaders(headers: Headers): RequestContext {
  return { requestId: getRequestId(headers), ip: getClientIp(headers) };
}
