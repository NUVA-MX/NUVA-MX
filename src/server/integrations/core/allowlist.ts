import 'server-only';
import { isIP } from 'node:net';
import { IntegrationError } from './errors';

/**
 * Validates an outbound URL against a provider's exact-host allowlist.
 * Requires https, no credentials, no IP literals, exact host match after URL parsing,
 * and port 443 unless the allowlist entry is written as host:port.
 */
export function assertAllowedUrl(rawUrl: string, allowedHosts: readonly string[], provider?: string): URL {
  const fail = (why: string): never => {
    throw new IntegrationError('allowlist', `URL rejected: ${why}`, { provider });
  };

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return fail('not a valid URL');
  }
  if (url.protocol !== 'https:') fail('https is required');
  if (url.username || url.password) fail('credentials in URL are not allowed');
  const bareHost = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(bareHost) !== 0 || url.hostname.startsWith('[')) fail('IP literals are not allowed');
  if (url.hostname.endsWith('.')) fail('host is not allowlisted');

  const hostWithPort = url.port ? `${url.hostname}:${url.port}` : url.hostname;
  const allowed = allowedHosts.map((h) => h.toLowerCase());
  const ok = url.port === '' || url.port === '443' ? allowed.includes(url.hostname) : allowed.includes(hostWithPort);
  if (!ok) fail('host is not allowlisted');
  return url;
}
