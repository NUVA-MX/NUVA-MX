import 'server-only';

/** Standard JSON error: { error: code }, never cached, optional Retry-After (seconds). */
export function jsonError(status: number, code: string, opts: { retryAfter?: number } = {}): Response {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
  if (opts.retryAfter !== undefined) headers['Retry-After'] = String(Math.max(1, Math.ceil(opts.retryAfter)));
  return new Response(JSON.stringify({ error: code }), { status, headers });
}

/** 200 JSON that a shared cache (CDN) may keep. Only for public, non-personal data; errors stay `no-store`. */
export function jsonPublicCached(body: unknown, cacheControl: string): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Cache-Control': cacheControl, 'Content-Type': 'application/json' } });
}

export function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
  });
}
