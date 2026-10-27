import 'server-only';
import { and, count, desc, eq, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { supplierProducts as t, supplierSyncRuns as runs } from '@/lib/db/schema';
import type { NormalizedProduct, SyncStore } from './types';

const PROVIDER = 'innovation';
export const STALE_RUN_MS = 10 * 60 * 1000;
/** Minimum gap between the end of one run and the start of the next (protects the supplier quota). */
export const COOLDOWN_MS = 5 * 60 * 1000;
const CHUNK = 100;
const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: unknown; cause?: { code?: unknown } } | null;
  return e?.code === UNIQUE_VIOLATION || e?.cause?.code === UNIQUE_VIOLATION;
}

function toValues(runId: string, p: NormalizedProduct, now: Date) {
  return {
    provider: PROVIDER,
    code: p.code,
    name: p.name,
    description: p.description,
    category: p.category,
    subcategory: p.subcategory,
    image: p.image,
    images: p.images,
    variants: p.variants,
    specs: p.specs,
    costCents: p.costCents,
    totalStock: p.totalStock,
    searchText: p.searchText,
    active: true,
    lastRunId: runId,
    updatedAt: now,
  };
}

const excluded = (column: string) => sql.raw(`excluded."${column}"`);

export function createDrizzleSyncStore(): SyncStore {
  return {
    async startRun(trigger, now) {
      const db = getDb();
      await db
        .update(runs)
        .set({ status: 'failed', errorKind: 'stale', finishedAt: now })
        .where(and(eq(runs.provider, PROVIDER), eq(runs.status, 'running'), lt(runs.startedAt, new Date(now.getTime() - STALE_RUN_MS))));
      const [last] = await db
        .select({ at: runs.finishedAt })
        .from(runs)
        .where(and(eq(runs.provider, PROVIDER), isNotNull(runs.finishedAt)))
        .orderBy(desc(runs.finishedAt))
        .limit(1);
      if (last?.at && now.getTime() - last.at.getTime() < COOLDOWN_MS) return { blocked: 'cooldown' };
      try {
        const [row] = await db.insert(runs).values({ provider: PROVIDER, trigger, status: 'running', startedAt: now }).returning({ id: runs.id });
        return row ? { runId: row.id } : { blocked: 'running' };
      } catch (err) {
        if (isUniqueViolation(err)) return { blocked: 'running' };
        throw err;
      }
    },

    async activeCount() {
      const [row] = await getDb().select({ n: count() }).from(t).where(and(eq(t.provider, PROVIDER), eq(t.active, true)));
      return row?.n ?? 0;
    },

    async upsertProducts(runId, rows) {
      const db = getDb();
      const now = new Date();
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map((p) => toValues(runId, p, now));
        await db
          .insert(t)
          .values(chunk)
          .onConflictDoUpdate({
            target: [t.provider, t.code],
            set: {
              name: excluded('name'),
              description: excluded('description'),
              category: excluded('category'),
              subcategory: excluded('subcategory'),
              image: excluded('image'),
              images: excluded('images'),
              variants: excluded('variants'),
              specs: excluded('specs'),
              costCents: excluded('cost_cents'),
              totalStock: excluded('total_stock'),
              searchText: excluded('search_text'),
              active: true,
              lastRunId: excluded('last_run_id'),
              updatedAt: excluded('updated_at'),
            },
          });
      }
    },

    async completeRun(runId, summary, now) {
      return getDb().transaction(async (tx) => {
        const gone = await tx
          .update(t)
          .set({ active: false, updatedAt: now })
          .where(and(eq(t.provider, PROVIDER), eq(t.active, true), or(isNull(t.lastRunId), ne(t.lastRunId, runId))))
          .returning({ id: t.id });
        await tx
          .update(runs)
          .set({ status: 'success', finishedAt: now, accepted: summary.accepted, rejected: summary.rejected, deactivated: gone.length })
          .where(eq(runs.id, runId));
        return gone.length;
      });
    },

    async failRun(runId, summary, errorKind, now) {
      await getDb()
        .update(runs)
        .set({ status: 'failed', finishedAt: now, accepted: summary.accepted, rejected: summary.rejected, errorKind })
        .where(eq(runs.id, runId));
    },
  };
}
