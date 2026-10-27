import 'server-only';
import { isDbConfigured } from '@/lib/db/config';
import { innovationEnv, isProduction, sampleDataMode } from '@/server/env';

export type CatalogMode = 'db' | 'sample' | 'empty' | 'error' | 'disabled';

/**
 * Where public catalog reads come from (never the supplier):
 * - INTEGRATION_INNOVATION_CATALOG_PUBLIC=false: disabled.
 * - NUVA_SAMPLE_DATA=empty|error: those states (testing).
 * - NUVA_SAMPLE_DATA=sample outside production: fake items even when a DB is configured (local preview).
 * - With DATABASE_URL: the stored snapshot (also when the provider itself is disabled or its breaker is open).
 * - Without DB: sample data in development (or NUVA_SAMPLE_DATA=sample); disabled in production.
 */
export function catalogMode(): CatalogMode {
  if (!innovationEnv().catalogPublic) return 'disabled';
  const sample = sampleDataMode();
  if (sample === 'empty' || sample === 'error') return sample;
  if (sample === 'sample' && !isProduction()) return 'sample';
  if (isDbConfigured()) return 'db';
  return !isProduction() || sample === 'sample' ? 'sample' : 'disabled';
}
