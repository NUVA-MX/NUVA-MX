import { catalogFailure, catalogGate } from '@/server/catalog/route-guard';
import { parseListQuery } from '@/server/catalog/params';
import { getCatalogList } from '@/server/catalog/service';
import { innovationEnv } from '@/server/env';
import { jsonError, jsonOk } from '@/server/http/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public catalog list/search (rate limited per IP). Reads the stored snapshot only; never calls the supplier. */
export async function GET(request: Request): Promise<Response> {
  const gate = await catalogGate(request);
  if (gate.response) return gate.response;
  const query = parseListQuery(new URL(request.url), { pricesVisible: innovationEnv().showPrices });
  if (!query) return jsonError(400, 'bad_request');
  try {
    return jsonOk(await getCatalogList(query));
  } catch (err) {
    return catalogFailure('api.catalog.list_error', gate.requestId, err);
  }
}
