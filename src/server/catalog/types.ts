import 'server-only';

/** One variant as stored (stock numbers stay on the server). */
export type StoredVariant = { code: string; tone: string; hex: string | null; image: string | null; stock: number | null };

export type StoredSpecs = {
  material: string | null;
  size: string | null;
  weight: string | null;
  printTechnique: string | null;
  printArea: string | null;
  packQty: string | null;
};

/** A validated, sanitized product ready to upsert. */
export type NormalizedProduct = {
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  image: string | null;
  images: string[];
  variants: StoredVariant[];
  specs: StoredSpecs;
  costCents: number | null;
  totalStock: number | null;
  searchText: string;
};

export type NormalizeResult = {
  rows: NormalizedProduct[];
  rejected: number;
  reasons: Record<string, number>;
};

export type SyncTrigger = 'cron' | 'admin';
export type SyncStatus = 'success' | 'skipped' | 'cooldown' | 'outside_window' | 'failed' | 'not_configured';

/** A claimed run id, or the reason no run was started. */
export type StartResult = { runId: string } | { blocked: 'running' | 'cooldown' };

export type SyncOutcome = {
  status: SyncStatus;
  accepted: number;
  rejected: number;
  deactivated: number;
  errorKind?: string;
};

export type RunSummary = { accepted: number; rejected: number };

/** Persistence used by the sync. The Drizzle implementation is in store.ts; tests use an in-memory fake. */
export interface SyncStore {
  /** Marks stuck runs failed, refuses within the cooldown after the last run, then claims the single running slot. */
  startRun(trigger: SyncTrigger, now: Date): Promise<StartResult>;
  activeCount(): Promise<number>;
  upsertProducts(runId: string, rows: readonly NormalizedProduct[]): Promise<void>;
  /** In one transaction: deactivate rows not seen in this run and mark the run successful. Returns the deactivated count. */
  completeRun(runId: string, summary: RunSummary, now: Date): Promise<number>;
  failRun(runId: string, summary: RunSummary, errorKind: string, now: Date): Promise<void>;
}
