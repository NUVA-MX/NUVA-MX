import 'server-only';
import { getDb } from '@/lib/db/client';
import { auditEvents } from '@/lib/db/schema';

export type ActorType = 'admin' | 'system' | 'integration' | 'webhook';
export type Outcome = 'success' | 'failure' | 'denied';

export type AuditRecord = {
  actorType: ActorType;
  actorId: string | null;
  action: string;
  target: string | null;
  outcome: Outcome;
  ipHash: string | null;
  requestId: string | null;
  metadata: unknown;
  createdAt: Date;
};

export interface AuditStore {
  insert(record: AuditRecord): Promise<void>;
}

export class MemoryAuditStore implements AuditStore {
  readonly records: AuditRecord[] = [];
  async insert(record: AuditRecord): Promise<void> {
    this.records.push(record);
  }
}

export class DrizzleAuditStore implements AuditStore {
  async insert(r: AuditRecord): Promise<void> {
    await getDb().insert(auditEvents).values({
      createdAt: r.createdAt,
      actorType: r.actorType,
      actorId: r.actorId,
      action: r.action,
      target: r.target,
      outcome: r.outcome,
      ipHash: r.ipHash,
      requestId: r.requestId,
      metadata: r.metadata ?? null,
    });
  }
}
