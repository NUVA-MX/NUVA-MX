import { catalogFailure, catalogGate } from '@/server/catalog/route-guard';
import { getCatalogCategories } from '@/server/catalog/service';
import { jsonOk } from '@/server/http/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Categories with counts, derived from the active stored rows. */
export async function GET(request: Request): Promise<Response> {
  const gate = await catalogGate(request);
  if (gate.response) return gate.response;
  try {
    return jsonOk(await getCatalogCategories());
  } catch (err) {
    return catalogFailure('api.catalog.categories_error', gate.requestId, err);
  }
}
