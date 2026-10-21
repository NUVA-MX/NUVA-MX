import 'server-only';
import { and, eq, lt, or, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { idempotencyKeys } from '@/lib/db/schema';
import { isDbConfigured, isProduction } from '@/server/env';
import { log } from '@/server/log/logger';
import { IntegrationError } from './errors';

export type BeginResult =
  | { state: 'new' }
  | { state: 'completed'; response: unknown }
  | { state: 'in_progress' }
  | { state: 'mismatch' };

export interface IdempotencyStore {
  /** Atomically claims (scope, key). Expired or failed rows can be claimed again. */
  begin(scope: string, key: string, requestHash: string, expiresAt: Date): Promise<BeginResult>;
  complete(scope: string, key: string, response: unknown): Promise<void>;
  fail(scope: string, key: string): Promise<void>;
}

type Row = { requestHash: string; status: 'in_progress' | 'completed' | 'failed'; response: unknown; expiresAt: Date };

export class MemoryIdempotencyStore implements IdempotencyStore {
  private rows = new Map<string, Row>();
  constructor(private readonly now: () => number = Date.now) {}

  async begin(scope: string, key: string, requestHash: string, expiresAt: Date): Promise<BeginResult> {
    const id = `${scope}\u0000${key}`;
    const row = this.rows.get(id);
    if (!row || row.expiresAt.getTime() < this.now() || row.status === 'failed') {
      this.rows.set(id, { requestHash, status: 'in_progress', response: null, expiresAt });
      return { state: 'new' };
    }
    if (row.requestHash !== requestHash) return { state: 'mismatch' };
    if (row.status === 'completed') return { state: 'completed', response: row.response };
    return { state: 'in_progress' };
  }
  async complete(scope: string, key: string, response: unknown): Promise<void> {
    const row = this.rows.get(`${scope}\u0000${key}`);
    if (row) Object.assign(row, { status: 'completed', response });
  }
  async fail(scope: string, key: string): Promise<void> {
    const row = this.rows.get(`${scope}\u0000${key}`);
    if (row) row.status = 'failed';
  }
}

export class DrizzleIdempotencyStore implements IdempotencyStore {
  async begin(scope: string, key: string, requestHash: string, expiresAt: Date): Promise<BeginResult> {
    const db = getDb();
    const claimed = await db
      .insert(idempotencyKeys)
      .values({ scope, key, requestHash, status: 'in_progress', expiresAt })
      .onConflictDoUpdate({
        target: [idempotencyKeys.scope, idempotencyKeys.key],
        set: { requestHash, status: 'in_progress', response: null, createdAt: sql`now()`, expiresAt },
        setWhere: or(lt(idempotencyKeys.expiresAt, sql`now()`), eq(idempotencyKeys.status, 'failed')),
      })
      .returning({ key: idempotencyKeys.key });
    if (claimed.length > 0) return { state: 'new' };

    const [row] = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.scope, scope), eq(idempotencyKeys.key, key)))
      .limit(1);
    if (!row) return { state: 'in_progress' }; // raced with a delete; caller may retry
    if (row.requestHash !== requestHash) return { state: 'mismatch' };
    if (row.status === 'completed') return { state: 'completed', response: row.response };
    return { state: 'in_progress' };
  }
  async complete(scope: string, key: string, response: unknown): Promise<void> {
    await getDb()
      .update(idempotencyKeys)
      .set({ status: 'completed', response: response ?? null })
      .where(and(eq(idempotencyKeys.scope, scope), eq(idempotencyKeys.key, key)));
  }
  async fail(scope: string, key: string): Promise<void> {
    await getDb()
      .update(idempotencyKeys)
      .set({ status: 'failed' })
      .where(and(eq(idempotencyKeys.scope, scope), eq(idempotencyKeys.key, key)));
  }
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export function createWithIdempotency(store: IdempotencyStore, opts: { ttlMs?: number; now?: () => number } = {}) {
  const now = opts.now ?? Date.now;
  /**
   * Runs fn at most once per (scope, key). A completed key replays the stored response; the same key with a
   * different requestHash, or a concurrent in-progress call, is rejected with an IntegrationError.
   * The response must be JSON-serializable.
   */
  return async function withIdempotency<T>(scope: string, key: string, requestHash: string, fn: () => Promise<T>): Promise<T> {
    const begun = await store.begin(scope, key, requestHash, new Date(now() + (opts.ttlMs ?? DEFAULT_TTL_MS)));
    if (begun.state === 'completed') return begun.response as T;
    if (begun.state === 'mismatch') {
      throw new IntegrationError('idempotency_mismatch', 'idempotency key was already used with a different request', { provider: scope });
    }
    if (begun.state === 'in_progress') {
      throw new IntegrationError('idempotency_in_progress', 'a request with this idempotency key is already in progress', { provider: scope });
    }
    let result: T;
    try {
      result = await fn();
    } catch (err) {
      // fn itself failed: release the key so a retry may run it again.
      await store.fail(scope, key).catch(() => undefined);
      throw err;
    }
    // The side effect already happened. If recording it fails, leave the row in_progress (never re-claimable
    // until it expires) so a retry cannot repeat the effect, and still return the real result.
    await store.complete(scope, key, result).catch((err) => {
      log.error('idempotency.complete_failed', { scope, error: err });
    });
    return result;
  };
}

let defaultStore: IdempotencyStore | undefined;

/**
 * Drizzle store when DATABASE_URL is set. Without a database, development uses an in-memory store (per
 * instance); production refuses with IntegrationError('store_unavailable'), because per-instance memory
 * cannot stop a retry on another instance from repeating a side effect (e.g. a charge).
 */
export function getIdempotencyStore(): IdempotencyStore {
  if (defaultStore) return defaultStore;
  if (isDbConfigured()) return (defaultStore = new DrizzleIdempotencyStore());
  if (isProduction()) {
    throw new IntegrationError('store_unavailable', 'idempotency requires DATABASE_URL in production');
  }
  return (defaultStore = new MemoryIdempotencyStore());
}

/** Test helper. */
export function setIdempotencyStoreForTests(store: IdempotencyStore | undefined): void {
  defaultStore = store;
}

export async function withIdempotency<T>(scope: string, key: string, requestHash: string, fn: () => Promise<T>): Promise<T> {
  return createWithIdempotency(getIdempotencyStore())(scope, key, requestHash, fn);
}
