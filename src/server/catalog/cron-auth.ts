import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

const sha256 = (value: string): Buffer => createHash('sha256').update(value).digest();

/**
 * Constant-time check of `Authorization: Bearer <secret>`. Both sides are hashed first, so the comparison
 * always runs on equal-length buffers and the secret length does not leak. False when no secret is configured.
 */
export function verifyCronBearer(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return false;
  return timingSafeEqual(sha256(match[1]), sha256(secret));
}
