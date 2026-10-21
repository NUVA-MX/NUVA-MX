import 'server-only';
import { getEnvSafe } from '@/server/env';
import { hashIdentifier } from '@/server/http/hash';
import { createLogger, type Logger } from '@/server/log/logger';
import { redact } from '@/server/log/redact';
import { DrizzleAuditStore, type ActorType, type AuditStore, type Outcome } from './store';

export type AuditEvent = {
  actorType: ActorType;
  actorId?: string | null;
  /** Dotted name, e.g. 'auth.login', 'product.create'. */
  action: string;
  target?: string | null;
  outcome: Outcome;
  /** Raw client IP. Only its salted hash is stored; omitted when AUDIT_IP_SALT is unset. */
  ip?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
};

export type AuditFn = (event: AuditEvent) => Promise<void>;

export type AuditDeps = {
  /** Null = no database: only a log line is written. */
  store: AuditStore | null;
  salt?: string;
  log?: Logger;
};

/** Builds an audit function. It never throws: failures are logged. */
export function createAuditor(deps: AuditDeps): AuditFn {
  const log = deps.log ?? createLogger();
  return async function audit(event) {
    try {
      const metadata = event.metadata ? redact(event.metadata) : null;
      const ipHash = event.ip && event.ip !== 'unknown' && deps.salt ? hashIdentifier(event.ip, deps.salt) : null;
      const actorId = event.actorId ?? null;
      log.info('audit', {
        actorType: event.actorType,
        actorId,
        action: event.action,
        target: event.target ?? null,
        outcome: event.outcome,
        requestId: event.requestId ?? undefined,
        metadata,
      });
      if (!deps.store) return;
      await deps.store.insert({
        actorType: event.actorType,
        actorId,
        action: event.action,
        target: event.target ?? null,
        outcome: event.outcome,
        ipHash,
        requestId: event.requestId ?? null,
        metadata,
        createdAt: new Date(),
      });
    } catch (err) {
      try {
        log.error('audit.write_failed', { action: event.action, error: err });
      } catch {
        // swallow: auditing must never break the caller
      }
    }
  };
}

let defaultAudit: AuditFn | undefined;

/** Application-wide audit function (Drizzle store when DATABASE_URL is set, log-only otherwise). */
export const audit: AuditFn = async (event) => {
  try {
    if (!defaultAudit) {
      const env = getEnvSafe();
      defaultAudit = createAuditor({
        store: env?.databaseUrl ? new DrizzleAuditStore() : null,
        salt: env?.auditIpSalt,
      });
    }
    await defaultAudit(event);
  } catch {
    // never throw
  }
};

/** Test helper. */
export function setAuditForTests(fn: AuditFn | undefined): void {
  defaultAudit = fn;
}
