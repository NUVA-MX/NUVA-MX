import { CATALOG_CODE_PATTERN } from '@/lib/catalog/types';
import { catalogFailure, catalogGate } from '@/server/catalog/route-guard';
import { getCatalogDetail } from '@/server/catalog/service';
import { jsonError, jsonOk } from '@/server/http/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ code: string }> };

/** One product by code. A code that fails the pattern is a 404 without touching the store. */
export async function GET(request: Request, context: Context): Promise<Response> {
  const gate = await catalogGate(request);
  if (gate.response) return gate.response;
  const { code } = await context.params;
  if (!CATALOG_CODE_PATTERN.test(code)) return jsonError(404, 'not_found');
  try {
    const product = await getCatalogDetail(code);
    return product ? jsonOk({ product }) : jsonError(404, 'not_found');
  } catch (err) {
    return catalogFailure('api.catalog.item_error', gate.requestId, err);
  }
}
