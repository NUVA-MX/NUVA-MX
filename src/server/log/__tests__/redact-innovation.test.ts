import { describe, expect, it } from 'vitest';
import { REDACTED, redact, redactString } from '../redact';

describe('redaction of supplier credentials', () => {
  it('masks User and Clave query parameters even when short', () => {
    const out = redactString('GET https://x.test/p?User=a@b.mx&Clave=abc&page=2', { secretValues: [] });
    expect(out).not.toContain('a@b.mx');
    expect(out).not.toContain('abc');
    expect(out).toContain('page=2');
    expect(redactString('?user=bob&clave=xyz', { secretValues: [] })).not.toMatch(/bob|xyz/);
  });

  it('masks the auth-token header key', () => {
    const out = redact({ headers: { 'auth-token': 'tok-123' }, note: 'ok' }, { secretValues: [] }) as { headers: Record<string, string> };
    expect(out.headers['auth-token']).toBe(REDACTED);
  });
});
