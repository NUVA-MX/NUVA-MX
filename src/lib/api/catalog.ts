// The only place in the frontend that calls the catalog API.
import {
  parseCategoriesResponse,
  parseDetail,
  parseListResponse,
} from '@/lib/catalog/validate';
import type { CatalogCategoriesResponse, CatalogDetail, CatalogListResponse } from '@/lib/catalog/types';

export class CatalogError extends Error {
  constructor(public status: number) {
    super(`catalog request failed: ${status}`);
  }
}

export type CatalogQuery = { q: string; category: string; subcategory: string; page: number; pageSize: number };

async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(path, { cache: 'no-store', signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new CatalogError(res.status);
  return res.json();
}

export async function fetchCatalogList(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogListResponse> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.subcategory) params.set('subcategory', query.subcategory);
  const parsed = parseListResponse(await getJson(`/api/catalog?${params.toString()}`, signal));
  if (!parsed) throw new CatalogError(502);
  return parsed;
}

export async function fetchCatalogCategories(signal?: AbortSignal): Promise<CatalogCategoriesResponse> {
  const parsed = parseCategoriesResponse(await getJson('/api/catalog/categories', signal));
  if (!parsed) throw new CatalogError(502);
  return parsed;
}

export async function fetchCatalogItem(code: string, signal?: AbortSignal): Promise<CatalogDetail> {
  const body = await getJson(`/api/catalog/items/${encodeURIComponent(code)}`, signal);
  const product = parseDetail((body as { product?: unknown } | null)?.product);
  if (!product) throw new CatalogError(502);
  return product;
}
