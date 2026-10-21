import { describe, expect, it } from 'vitest';
import type { Logger } from '@/server/log/logger';
import { createAuditor } from '../audit';
import { MemoryAuditStore, type AuditStore } from '../store';

function fakeLog() {
  const calls: Array<{ level: string; event: string; fields?: Record<string, unknown> }> = [];
  const mk = (level: string) => (event: string, fields?: Record<string, unknown>) => void calls.push({ level, event, fields });
  const log = { debug: mk('debug'), info: mk('info'), warn: mk('warn'), error: mk('error'), child: () => log } as unknown as Logger;
  return { log, calls };
}
const SALT = 's'.repeat(32);

describe('audit', () => {
  it('stores redacted metadata and a salted IP hash, never the raw IP', async () => {
    const store = new MemoryAuditStore();
    const { log } = fakeLog();
    const audit = createAuditor({ store, salt: SALT, log });
    await audit({
      actorType: 'admin',
      actorId: 'u1',
      action: 'product.create',
      target: 'p1',
      outcome: 'success',
      ip: '203.0.113.9',
      requestId: 'r1',
      metadata: { name: 'Mug', password: 'hunter2', contact: 'a@b.com' },
    });
    expect(store.records).toHaveLength(1);
    const rec = store.records[0];
    expect(rec.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rec)).not.toContain('203.0.113.9');
    expect(JSON.stringify(rec)).not.toContain('hunter2');
    expect(JSON.stringify(rec)).not.toContain('a@b.com');
    expect(rec.metadata).toMatchObject({ name: 'Mug' });
  });

  it('omits the IP hash when no salt is configured', async () => {
    const store = new MemoryAuditStore();
    await createAuditor({ store, log: fakeLog().log })({ actorType: 'system', action: 'x', outcome: 'success', ip: '1.2.3.4' });
    expect(store.records[0].ipHash).toBeNull();
  });

  it('never throws when the store fails, and logs the failure', async () => {
    const bad: AuditStore = {
      insert: async () => {
        throw new Error('db down');
      },
    };
    const { log, calls } = fakeLog();
    await expect(createAuditor({ store: bad, log })({ actorType: 'system', action: 'x', outcome: 'failure' })).resolves.toBeUndefined();
    expect(calls.some((c) => c.event === 'audit.write_failed')).toBe(true);
  });

  it('logs only when there is no store (no database)', async () => {
    const { log, calls } = fakeLog();
    await createAuditor({ store: null, log })({ actorType: 'admin', action: 'auth.logout', outcome: 'success' });
    expect(calls.map((c) => c.event)).toEqual(['audit']);
  });
});
