import { CATALOG_CODE_PATTERN } from '@/lib/catalog/types';
import { catalogFailure, catalogGate } from '@/server/catalog/route-guard';
import { getCatalogDetail } from '@/server/catalog/service';
import { jsonError, jsonPublicCached } from '@/server/http/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** CDN-cacheable: the catalog changes once a day and the detail is public data. */
const DETAIL_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=3600';

type Context = { params: Promise<{ code: string }> };

/**
 * One product by code. A code that fails the pattern is a 404 without touching the store. Cached hits are served by the
 * CDN and never reach this function, so the rate-limit gate below only sees cache misses.
 */
export async function GET(request: Request, context: Context): Promise<Response> {
  const gate = await catalogGate(request);
  if (gate.response) return gate.response;
  const { code } = await context.params;
  if (!CATALOG_CODE_PATTERN.test(code)) return jsonError(404, 'not_found');
  try {
    const product = await getCatalogDetail(code);
    return product ? jsonPublicCached({ product }, DETAIL_CACHE_CONTROL) : jsonError(404, 'not_found');
  } catch (err) {
    return catalogFailure('api.catalog.item_error', gate.requestId, err);
  }
}
