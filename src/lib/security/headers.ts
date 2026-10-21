// Pure (no server-only): used by next.config.ts and unit tests.

export type SecurityHeader = { key: string; value: string };

export type HeaderOptions = {
  isDev: boolean;
  /** Public host of the Vercel Blob store (or a wildcard in development), used for next/image sources. Omitted: no remote images. */
  blobHost?: string;
};

export function buildCsp({ isDev, blobHost }: HeaderOptions): string {
  const directives = [
    "default-src 'self'",
    // Next 16 inlines its bootstrap/flight scripts, so 'unsafe-inline' stays until a nonce setup (proxy.ts) exists.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${blobHost ? ` https://${blobHost}` : ''}`,
    "font-src 'self'",
    // vercel.com/api/blob: Blob client-upload API; *.blob.vercel-storage.com: direct store endpoints.
    `connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com${isDev ? ' ws: wss:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (!isDev) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

/** Headers for every route. `/api/*` additionally gets Cache-Control: no-store (see apiHeaders). */
export function buildSecurityHeaders(opts: HeaderOptions): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: 'Content-Security-Policy', value: buildCsp(opts) },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ];
  if (!opts.isDev) headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' });
  return headers;
}

export const API_HEADERS: SecurityHeader[] = [{ key: 'Cache-Control', value: 'no-store' }];
