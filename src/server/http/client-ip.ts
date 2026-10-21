import 'server-only';
import { isIP } from 'node:net';
import { isTrustedProxy } from '@/server/env';

function expandIPv6(input: string): number[] | null {
  let ip = input.split('%')[0];
  // Embedded IPv4 tail (::ffff:1.2.3.4)
  const tail = ip.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const p = tail[2].split('.').map(Number);
    ip = `${tail[1]}${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...rest].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

/** Canonical textual form: IPv4-mapped IPv6 becomes IPv4; other IPv6 is fully expanded, lowercase. */
export function canonicalIp(ip: string): string {
  if (isIP(ip) !== 6) return ip;
  const g = expandIPv6(ip);
  if (!g) return ip;
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  }
  return g.map((x) => x.toString(16)).join(':');
}

/** Rate-limit identity: the IPv4 address, or the /64 prefix for IPv6 (clients rotate freely inside a /64). */
export function ipBucket(ip: string): string {
  const c = canonicalIp(ip);
  return isIP(c) === 6 ? `${c.split(':').slice(0, 4).join(':')}::/64` : c;
}

/**
 * Client IP as seen by the platform. The forwarding headers are only honored when they come from a trusted
 * proxy: on Vercel (which overwrites them) or with TRUST_PROXY_HEADERS=true. Otherwise they are client-controlled,
 * so they are ignored and the result is 'unknown'.
 */
export function getClientIp(headers: Headers, trusted: boolean = isTrustedProxy()): string {
  if (!trusted) return 'unknown';
  const candidates = [headers.get('x-real-ip'), headers.get('x-forwarded-for')?.split(',')[0]];
  for (const raw of candidates) {
    const ip = raw?.trim();
    if (ip && ip.length <= 45 && isIP(ip) !== 0) return canonicalIp(ip);
  }
  return 'unknown';
}
