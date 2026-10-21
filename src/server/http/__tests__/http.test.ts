import { describe, expect, it } from 'vitest';
import { getClientIp, ipBucket } from '../client-ip';
import { getRequestId } from '../request-context';
import { jsonError } from '../responses';

const h = (o: Record<string, string>) => new Headers(o);

describe('getClientIp', () => {
  it('prefers x-real-ip, then first x-forwarded-for, then unknown', () => {
    expect(getClientIp(h({ 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' }), true)).toBe('1.2.3.4');
    expect(getClientIp(h({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }), true)).toBe('9.9.9.9');
    expect(getClientIp(h({}), true)).toBe('unknown');
  });
  it('ignores forwarding headers unless the proxy is trusted', () => {
    expect(getClientIp(h({ 'x-real-ip': '1.2.3.4' }), false)).toBe('unknown');
    expect(getClientIp(h({ 'x-forwarded-for': '1.2.3.4' }))).toBe('unknown');
  });
  it('canonicalizes IPv6 and IPv4-mapped addresses, buckets IPv6 by /64', () => {
    expect(getClientIp(h({ 'x-real-ip': '::ffff:1.2.3.4' }), true)).toBe('1.2.3.4');
    expect(getClientIp(h({ 'x-real-ip': '0:0:0:0:0:0:0:1' }), true)).toBe(getClientIp(h({ 'x-real-ip': '::1' }), true));
    expect(ipBucket('2001:DB8:1:2:aaaa::1')).toBe(ipBucket('2001:db8:1:2:bbbb:cccc::9'));
    expect(ipBucket('2001:db8:1:3::1')).not.toBe(ipBucket('2001:db8:1:2::1'));
    expect(ipBucket('1.2.3.4')).toBe('1.2.3.4');
  });
  it('validates IPv4/IPv6 shape', () => {
    expect(getClientIp(h({ 'x-real-ip': 'not-an-ip' }), true)).toBe('unknown');
    expect(getClientIp(h({ 'x-real-ip': '1.2.3.4; drop table' }), true)).toBe('unknown');
    expect(getClientIp(h({ 'x-real-ip': '2001:db8::1' }), true)).toBe('2001:db8:0:0:0:0:0:1');
    expect(getClientIp(h({ 'x-real-ip': 'bad', 'x-forwarded-for': '5.6.7.8' }), true)).toBe('5.6.7.8');
  });
});

describe('getRequestId', () => {
  it('uses x-vercel-id or a random uuid', () => {
    expect(getRequestId(h({ 'x-vercel-id': 'iad1::abc-123' }))).toBe('iad1::abc-123');
    expect(getRequestId(h({}))).toMatch(/^[0-9a-f-]{36}$/);
    expect(getRequestId(h({ 'x-vercel-id': 'bad id with spaces' }))).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('jsonError', () => {
  it('sets status, no-store and Retry-After', async () => {
    const r = jsonError(429, 'rate_limited', { retryAfter: 12.2 });
    expect(r.status).toBe(429);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(r.headers.get('Retry-After')).toBe('13');
    expect(await r.json()).toEqual({ error: 'rate_limited' });
    expect(jsonError(404, 'not_found').headers.get('Retry-After')).toBeNull();
  });
});
