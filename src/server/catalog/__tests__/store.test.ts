import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks the Drizzle layer with a recording chain. It checks the control flow of the run lock (stale recovery,
// cooldown, unique-violation conflict); the SQL itself (partial unique index) still needs a real database.
const m = vi.hoisted(() => ({
  calls: [] as string[],
  sets: [] as unknown[],
  last: undefined as { at: Date | null } | undefined,
  insertError: undefined as unknown,
}));

vi.mock('@/lib/db/client', () => {
  const chain = (name: string, result: () => unknown): Record<string, unknown> => {
    const node: Record<string, unknown> = {};
    for (const k of ['set', 'from', 'where', 'orderBy', 'limit', 'values', 'returning']) {
      node[k] = (arg?: unknown) => {
        if (k === 'set') m.sets.push(arg);
        return node;
      };
    }
    node.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
      m.calls.push(name);
      try {
        resolve(result());
      } catch (e) {
        reject(e);
      }
    };
    return node;
  };
  return {
    getDb: () => ({
      update: () => chain('update', () => []),
      select: () => chain('select', () => (m.last ? [m.last] : [])),
      insert: () =>
        chain('insert', () => {
          if (m.insertError) throw m.insertError;
          return [{ id: 'run-1' }];
        }),
    }),
  };
});

import { COOLDOWN_MS, createDrizzleSyncStore, STALE_RUN_MS } from '../store';

const NOW = new Date('2026-10-26T15:30:00Z');

describe('drizzle sync store: run lock', () => {
  beforeEach(() => {
    m.calls.length = 0;
    m.sets.length = 0;
    m.last = undefined;
    m.insertError = undefined;
  });

  it('marks stale runs failed first, then claims the slot', async () => {
    const r = await createDrizzleSyncStore().startRun('cron', NOW);
    expect(r).toEqual({ runId: 'run-1' });
    expect(m.calls).toEqual(['update', 'select', 'insert']);
    expect(m.sets[0]).toMatchObject({ status: 'failed', errorKind: 'stale', finishedAt: NOW });
    expect(STALE_RUN_MS).toBe(10 * 60 * 1000);
  });

  it('a unique-violation on insert means another run is active (also when wrapped in a cause)', async () => {
    m.insertError = { code: '23505' };
    expect(await createDrizzleSyncStore().startRun('cron', NOW)).toEqual({ blocked: 'running' });
    m.insertError = Object.assign(new Error('query failed'), { cause: { code: '23505' } });
    expect(await createDrizzleSyncStore().startRun('admin', NOW)).toEqual({ blocked: 'running' });
  });

  it('other database errors propagate', async () => {
    m.insertError = new Error('connection lost');
    await expect(createDrizzleSyncStore().startRun('cron', NOW)).rejects.toThrow('connection lost');
  });

  it('refuses inside the cooldown after the last run and never inserts', async () => {
    m.last = { at: new Date(NOW.getTime() - COOLDOWN_MS + 1000) };
    expect(await createDrizzleSyncStore().startRun('admin', NOW)).toEqual({ blocked: 'cooldown' });
    expect(m.calls).not.toContain('insert');
    m.last = { at: new Date(NOW.getTime() - COOLDOWN_MS - 1000) };
    expect(await createDrizzleSyncStore().startRun('admin', NOW)).toEqual({ runId: 'run-1' });
  });
});
