import { describe, expect, it } from 'vitest';
import nextConfig from '../../../../next.config';
import { SUPPLIER_IMAGE_HOST, SUPPLIER_IMAGE_PATH_PREFIX, toSafeImageUrl } from '../images';

const ok = `https://${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}a/b.jpg`;

describe('toSafeImageUrl', () => {
  it('accepts https on the exact host and path', () => {
    expect(toSafeImageUrl(ok)).toBe(ok);
  });
  it('normalizes a protocol-relative URL', () => {
    expect(toSafeImageUrl(ok.replace('https:', ''))).toBe(ok);
  });
  it.each([
    ['http', ok.replace('https', 'http')],
    ['other host', 'https://evil.example/storage/v1/object/public/productos/a.jpg'],
    ['look-alike host', `https://${SUPPLIER_IMAGE_HOST}.evil.example${SUPPLIER_IMAGE_PATH_PREFIX}a.jpg`],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:image/png;base64,AAAA'],
    ['credentials', `https://u:p@${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}a.jpg`],
    ['port', `https://${SUPPLIER_IMAGE_HOST}:8443${SUPPLIER_IMAGE_PATH_PREFIX}a.jpg`],
    ['percent-encoded dots', `https://${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}%2e%2e/x.jpg`],
    ['percent-encoded slash', `${ok}%2Fx`],
    ['percent-encoded name', `https://${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}%61.jpg`],
    ['encoded fragment', `${ok}%23`],
    ['semicolon', `${ok};v=1`],
    ['empty segment', `https://${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}sub//a.jpg`],
    ['dot segment', `https://${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}../a.jpg`],
    ['backslash', `https://${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}a\\b.jpg`],
    ['query string', `${ok}?v=1`],
    ['fragment', `${ok}#x`],
    ['other path', `https://${SUPPLIER_IMAGE_HOST}/storage/v1/object/public/other/a.jpg`],
    ['protocol-relative evil host', '//evil.example/x.jpg'],
    ['too long', `${ok}${'a'.repeat(2100)}`],
    ['not a string', 42],
    ['empty', '  '],
  ])('rejects %s', (_name, value) => {
    expect(toSafeImageUrl(value)).toBeNull();
  });
});

describe('next.config supplier image pattern', () => {
  it('is exact: https, host, no port, no query, productos path only', async () => {
    const patterns = nextConfig.images?.remotePatterns ?? [];
    const p = patterns.find((x) => 'hostname' in x && x.hostname === SUPPLIER_IMAGE_HOST);
    expect(p).toEqual({ protocol: 'https', hostname: SUPPLIER_IMAGE_HOST, port: '', pathname: `${SUPPLIER_IMAGE_PATH_PREFIX}**`, search: '' });
  });
});
