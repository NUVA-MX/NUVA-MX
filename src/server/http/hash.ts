import 'server-only';
import { createHash } from 'node:crypto';

/** Salted SHA-256 hex. Used for IPs and email identifiers so raw values are never stored. */
export function hashIdentifier(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}
