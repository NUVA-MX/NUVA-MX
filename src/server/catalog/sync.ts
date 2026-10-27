import 'server-only';
import type { AuditFn } from '@/server/audit/audit';
import { IntegrationError, type InnovationClient } from '@/server/integrations';
import { fetchCatalog, SyncAbort } from './fetch-all';
import { normalizeProducts } from './normalize';
import type { NormalizeResult, SyncOutcome, SyncStore, SyncTrigger } from './types';
import { isInSupplierWindow } from './window';

export type SyncActor = { type: 'system' | 'admin'; id?: string; ip?: string; requestId?: string };

export type SyncDeps = {
  store: SyncStore | null;
  client: InnovationClient | null;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  audit: AuditFn;
  ignoreWindow: boolean;
  /** A run must accept at least this many rows (and >= 80% of the previous active count) to deactivate anything. */
  minAccepted: number;
  budgetMs: number;
};

const SHRINK_RATIO = 0.8;

/** True when the new snapshot is big enough to replace the previous one. */
export function shrinkGuardAllows(accepted: number, previousActive: number, minAccepted: number): boolean {
  return accepted >= minAccepted && accepted >= Math.ceil(previousActive * SHRINK_RATIO);
}

function errorKindOf(err: unknown): string {
  if (err instanceof IntegrationError) return err.kind;
  if (err instanceof SyncAbort) return err.kind;
  return 'unknown';
}

const empty = (status: SyncOutcome['status']): SyncOutcome => ({ status, accepted: 0, rejected: 0, deactivated: 0 });

/**
 * One catalog sync: window guard, run lock, fetch, normalize, shrink guard, write. Never throws; the result
 * carries counts and an error kind only (no supplier text). The previous snapshot stays untouched on any failure.
 */
export async function runCatalogSync(trigger: SyncTrigger, actor: SyncActor, deps: SyncDeps): Promise<SyncOutcome> {
  const { store, client } = deps;
  if (!store || !client) return empty('not_configured');
  if (!deps.ignoreWindow && !isInSupplierWindow(deps.now())) return empty('outside_window');

  const started = await store.startRun(trigger, deps.now());
  if ('blocked' in started) return empty(started.blocked === 'cooldown' ? 'cooldown' : 'skipped');
  const { runId } = started;

  const audit = (outcome: 'success' | 'failure', metadata: Record<string, unknown>) =>
    deps.audit({
      actorType: actor.type,
      actorId: actor.id ?? null,
      action: 'catalog.sync',
      target: 'innovation',
      outcome,
      ip: actor.ip,
      requestId: actor.requestId,
      metadata: { trigger, ...metadata },
    });

  let normalized: NormalizeResult = { rows: [], rejected: 0, reasons: {} };
  try {
    const fetched = await fetchCatalog(client, { now: () => deps.now().getTime(), sleep: deps.sleep, budgetMs: deps.budgetMs, windowOpen: () => deps.ignoreWindow || isInSupplierWindow(deps.now()) });
    normalized = normalizeProducts(fetched.products, fetched.tones, fetched.stock);
    const rejected = normalized.rejected + fetched.rejected;
    normalized = { ...normalized, rejected };
    if (normalized.rows.length === 0) throw new SyncAbort('empty');
    if (!shrinkGuardAllows(normalized.rows.length, await store.activeCount(), deps.minAccepted)) throw new SyncAbort('shrink_guard');

    await store.upsertProducts(runId, normalized.rows);
    const summary = { accepted: normalized.rows.length, rejected };
    const deactivated = await store.completeRun(runId, summary, deps.now());
    await audit('success', { ...summary, deactivated, reasons: normalized.reasons });
    return { status: 'success', ...summary, deactivated };
  } catch (err) {
    const errorKind = errorKindOf(err);
    const summary = { accepted: normalized.rows.length, rejected: normalized.rejected };
    await store.failRun(runId, summary, errorKind, deps.now()).catch(() => undefined);
    await audit('failure', { ...summary, errorKind });
    return { status: 'failed', ...summary, deactivated: 0, errorKind };
  }
}
