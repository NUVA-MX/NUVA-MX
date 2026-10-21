import { describe, expect, it } from 'vitest';
import { buildCsp, buildSecurityHeaders } from '../headers';

const blobHost = 'abc123.public.blob.vercel-storage.com';
const get = (list: { key: string; value: string }[], key: string) => list.find((h) => h.key === key)?.value;

describe('buildSecurityHeaders (production)', () => {
  const headers = buildSecurityHeaders({ isDev: false, blobHost });
  const csp = get(headers, 'Content-Security-Policy')!;

  it('has the full CSP', () => {
    for (const d of [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://${blobHost}`,
      "font-src 'self'",
      "connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ]) {
      expect(csp).toContain(d);
    }
    expect(csp).not.toContain('unsafe-eval');
  });
  it('has HSTS without preload, COOP and the classic headers', () => {
    expect(get(headers, 'Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains');
    expect(get(headers, 'Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(get(headers, 'X-Frame-Options')).toBe('DENY');
    expect(get(headers, 'X-Content-Type-Options')).toBe('nosniff');
    expect(get(headers, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(get(headers, 'Permissions-Policy')).toContain('camera=()');
  });
});

describe('buildSecurityHeaders (development)', () => {
  const headers = buildSecurityHeaders({ isDev: true, blobHost });
  it('allows unsafe-eval, and omits HSTS and upgrade-insecure-requests', () => {
    const csp = buildCsp({ isDev: true, blobHost });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain('upgrade-insecure-requests');
    expect(get(headers, 'Strict-Transport-Security')).toBeUndefined();
  });
});
