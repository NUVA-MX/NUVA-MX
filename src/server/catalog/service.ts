import 'server-only';
import type {
  CatalogCard,
  CatalogCategoriesResponse,
  CatalogDetail,
  CatalogListResponse,
} from '@/lib/catalog/types';
import { sampleCatalog } from '@/lib/catalog/sample';
import { catalogMode } from './mode';
import { innovationEnv } from '@/server/env';
import { isStale, toCard, toDetail, type PriceRule } from './public';
import { getProductByCode, lastSuccessfulSyncAt, listCategoryCounts, listProducts, type ListFilters } from './queries';
import { searchKey } from './search';

export type ListParams = ListFilters;

function priceRule(): PriceRule {
  const e = innovationEnv();
  return { show: e.showPrices, factor: e.priceFactor };
}

const disabledList = (p: ListParams): CatalogListResponse => ({ enabled: false, items: [], page: p.page, pageSize: p.pageSize, total: 0, updatedAt: null });

function sampleList(p: ListParams): CatalogListResponse {
  const words = searchKey(p.q ?? '').split(' ').filter(Boolean);
  const matches = sampleCatalog.filter((c) => {
    if (p.category && c.category !== p.category) return false;
    if (p.subcategory && c.subcategory !== p.subcategory) return false;
    const text = searchKey(`${c.name} ${c.code} ${c.category ?? ''} ${c.subcategory ?? ''}`);
    return words.every((w) => text.includes(w));
  });
  if (p.sort === 'name_desc') matches.sort((a, b) => b.name.localeCompare(a.name, 'es') || a.code.localeCompare(b.code));
  else if (p.sort === 'price_asc' || p.sort === 'price_desc') matches.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name));
  const start = (p.page - 1) * p.pageSize;
  const items: CatalogCard[] = matches.slice(start, start + p.pageSize).map(({ code, name, category, subcategory, image, colors, variantCount, availability, price }) => ({
    code, name, category, subcategory, image, colors, variantCount, availability, price,
  }));
  return { enabled: true, items, page: p.page, pageSize: p.pageSize, total: matches.length, updatedAt: null };
}

/** Public list. Throws on a store error (the route answers 500 server_error). */
export async function getCatalogList(p: ListParams): Promise<CatalogListResponse> {
  const mode = catalogMode();
  if (mode === 'disabled') return disabledList(p);
  if (mode === 'error') throw new Error('catalog error mode');
  if (mode === 'empty') return { ...disabledList(p), enabled: true };
  if (mode === 'sample') return sampleList(p);
  const [{ rows, total }, syncedAt] = await Promise.all([listProducts(p), lastSuccessfulSyncAt()]);
  const stale = isStale(syncedAt, new Date());
  return { enabled: true, items: rows.map((r) => toCard(r, stale, priceRule())), page: p.page, pageSize: p.pageSize, total, updatedAt: syncedAt?.toISOString() ?? null };
}

export function groupCategories(counts: readonly { category: string; subcategory: string | null; n: number }[]): CatalogCategoriesResponse['categories'] {
  const byName = new Map<string, { name: string; count: number; subcategories: string[] }>();
  for (const c of counts) {
    const entry = byName.get(c.category) ?? { name: c.category, count: 0, subcategories: [] };
    entry.count += c.n;
    if (c.subcategory && !entry.subcategories.includes(c.subcategory)) entry.subcategories.push(c.subcategory);
    byName.set(c.category, entry);
  }
  return [...byName.values()];
}

export async function getCatalogCategories(): Promise<CatalogCategoriesResponse> {
  const mode = catalogMode();
  if (mode === 'disabled') return { enabled: false, categories: [] };
  if (mode === 'error') throw new Error('catalog error mode');
  if (mode === 'empty') return { enabled: true, categories: [] };
  if (mode === 'sample') {
    return { enabled: true, categories: groupCategories(sampleCatalog.flatMap((c) => (c.category ? [{ category: c.category, subcategory: c.subcategory, n: 1 }] : []))) };
  }
  return { enabled: true, categories: groupCategories(await listCategoryCounts()) };
}

/** Detail or null (unknown, inactive, or catalog unavailable). */
export async function getCatalogDetail(code: string): Promise<CatalogDetail | null> {
  const mode = catalogMode();
  if (mode === 'disabled' || mode === 'empty') return null;
  if (mode === 'error') throw new Error('catalog error mode');
  if (mode === 'sample') return sampleCatalog.find((c) => c.code === code) ?? null;
  const [row, syncedAt] = await Promise.all([getProductByCode(code), lastSuccessfulSyncAt()]);
  return row ? toDetail(row, isStale(syncedAt, new Date()), priceRule()) : null;
}
