import 'server-only';
import type { RuleSpec } from './types';

export type RateLimitIds = {
  ip?: string;
  /** Salted hash of the normalized email (never the raw email). */
  emailHash?: string;
  adminId?: string;
  provider?: string;
};

export type Rule = RuleSpec & { key(ids: RateLimitIds): string | undefined };

const MIN = 60_000;

/**
 * Login and upload IP limits skip the shared 'unknown' bucket (IP headers not trusted: not on Vercel and no
 * TRUST_PROXY_HEADERS). Otherwise every client would share one bucket and an anonymous caller could lock all
 * admins out. The per-email, per-admin and account-lockout limits still apply.
 */
const knownIp = (i: RateLimitIds) => (i.ip && i.ip !== 'unknown' ? i.ip : undefined);
const HOUR = 60 * MIN;

export const POLICIES = {
  products: [{ name: 'products.ip.min', limit: 60, windowMs: MIN, key: (i) => i.ip }],
  login: [
    { name: 'login.ip.min', limit: 5, windowMs: MIN, key: knownIp },
    { name: 'login.ip.hour', limit: 20, windowMs: HOUR, key: knownIp },
  ],
  // Failed logins only: peeked before the password check, consumed on failure. Successful logins never
  // count, so someone who knows an admin email cannot use it to lock that admin out.
  loginFailures: [{ name: 'login.email.hour', limit: 10, windowMs: HOUR, key: (i) => i.emailHash }],
  webhook: [{ name: 'webhook.ip.min', limit: 120, windowMs: MIN, key: (i) => (i.ip && i.provider ? `${i.provider}:${i.ip}` : undefined) }],
  // Checked before authentication so anonymous callers cannot hammer the endpoint (or the audit log).
  uploadIp: [{ name: 'upload.ip.min', limit: 30, windowMs: MIN, key: knownIp }],
  upload: [{ name: 'upload.admin.min', limit: 30, windowMs: MIN, key: (i) => i.adminId }],
  // Every /encargo content or project write (server actions), per admin.
  adminWrite: [{ name: 'admin.write.min', limit: 60, windowMs: MIN, key: (i) => i.adminId }],
} as const satisfies Record<string, readonly Rule[]>;

export type PolicyName = keyof typeof POLICIES;
