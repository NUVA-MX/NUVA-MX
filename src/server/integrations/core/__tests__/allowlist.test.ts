import { describe, expect, it } from 'vitest';
import { assertAllowedUrl } from '../allowlist';
import { IntegrationError } from '../errors';

const HOSTS = ['api.example.test'];
const bad = (u: string, hosts: readonly string[] = HOSTS) => {
  try {
    assertAllowedUrl(u, hosts);
  } catch (e) {
    expect(e).toBeInstanceOf(IntegrationError);
    expect((e as IntegrationError).kind).toBe('allowlist');
    return;
  }
  throw new Error(`should have rejected ${u}`);
};

describe('assertAllowedUrl', () => {
  it('accepts exact https host', () => {
    expect(assertAllowedUrl('https://api.example.test/v1/ping?x=1', HOSTS).pathname).toBe('/v1/ping');
    expect(assertAllowedUrl('https://API.EXAMPLE.TEST:443/x', HOSTS).hostname).toBe('api.example.test');
  });
  it('rejects http, other schemes and garbage', () => {
    bad('http://api.example.test/');
    bad('ftp://api.example.test/');
    bad('not a url');
    bad('//api.example.test/x');
  });
  it('rejects look-alike and trick hosts', () => {
    bad('https://api.example.test.evil.com/');
    bad('https://evil.com#api.example.test');
    bad('https://evil.com/?h=api.example.test');
    bad('https://evilapi.example.test/');
    bad('https://api.example.test@evil.com/');
    bad('https://api.example.test:pw@evil.com/');
    bad('https://evil.com\\@api.example.test/');
    bad('https://api.example.test./');
    bad('https://sub.api.example.test/');
  });
  it('rejects credentials in the URL even on an allowed host', () => {
    bad('https://user:pw@api.example.test/');
    bad('https://user@api.example.test/');
  });
  it('rejects IP literals', () => {
    bad('https://127.0.0.1/', ['127.0.0.1']);
    bad('https://[::1]/', ['::1', '[::1]']);
    bad('https://169.254.169.254/latest', HOSTS);
  });
  it('rejects non-443 ports unless allowlisted as host:port', () => {
    bad('https://api.example.test:8443/');
    expect(assertAllowedUrl('https://api.example.test:8443/', ['api.example.test:8443']).port).toBe('8443');
  });
});
