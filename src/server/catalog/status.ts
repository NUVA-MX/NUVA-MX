import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { isDbConfigured } from '@/lib/db/config';
import { getDb } from '@/lib/db/client';
import { supplierSyncRuns as runs } from '@/lib/db/schema';
import { innovationEnv } from '@/server/env';
import { activeProductCount } from './queries';

export type RunInfo = {
  status: string;
  trigger: string;
  startedAt: Date;
  finishedAt: Date | null;
  accepted: number;
  rejected: number;
  deactivated: number;
  errorKind: string | null;
};

export type CatalogStatus = {
  dbConfigured: boolean;
  providerEnabled: boolean;
  publicEnabled: boolean;
  activeProducts: number;
  runs: RunInfo[];
};

/** Admin page data: recent sync runs and counters. No supplier text, no costs. */
export async function getCatalogStatus(): Promise<CatalogStatus> {
  const env = innovationEnv();
  const base = { dbConfigured: isDbConfigured(), providerEnabled: env.enabled, publicEnabled: env.catalogPublic };
  if (!base.dbConfigured) return { ...base, activeProducts: 0, runs: [] };
  const recent = await getDb()
    .select({
      status: runs.status,
      trigger: runs.trigger,
      startedAt: runs.startedAt,
      finishedAt: runs.finishedAt,
      accepted: runs.accepted,
      rejected: runs.rejected,
      deactivated: runs.deactivated,
      errorKind: runs.errorKind,
    })
    .from(runs)
    .where(eq(runs.provider, 'innovation'))
    .orderBy(desc(runs.startedAt))
    .limit(10);
  return { ...base, activeProducts: await activeProductCount(), runs: recent };
}
