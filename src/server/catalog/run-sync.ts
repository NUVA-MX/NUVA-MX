import 'server-only';
import { audit } from '@/server/audit/audit';
import { isDbConfigured } from '@/lib/db/config';
import { innovationEnv } from '@/server/env';
import { getIntegrationClient, type InnovationClient } from '@/server/integrations';
import { createDrizzleSyncStore } from './store';
import { runCatalogSync, type SyncActor, type SyncDeps } from './sync';
import type { SyncOutcome, SyncTrigger } from './types';

// Expected full run: 1 s colors + 7.6 s stock + 15 pages x 2 s = ~39 s, so 52 s leaves ~25% slack and ~8 s before maxDuration (60).
const BUDGET_MS = 52_000;
const MIN_ACCEPTED = 100;

function defaultDeps(): SyncDeps {
  return {
    store: isDbConfigured() ? createDrizzleSyncStore() : null,
    client: getIntegrationClient<InnovationClient>('innovation'),
    now: () => new Date(),
    sleep: (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    audit,
    ignoreWindow: innovationEnv().ignoreWindow,
    minAccepted: MIN_ACCEPTED,
    budgetMs: BUDGET_MS,
  };
}

/** Entry point for the cron route and the admin action. */
export function syncCatalog(trigger: SyncTrigger, actor: SyncActor): Promise<SyncOutcome> {
  return runCatalogSync(trigger, actor, defaultDeps());
}
