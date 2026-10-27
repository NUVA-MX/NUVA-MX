import { CATALOG_MAX_FILTER, CATALOG_MAX_QUERY, type CatalogSort } from './types';
import { parsePageParam } from './pagination';

export type CatalogFilters = {
  q: string;
  category: string;
  subcategory: string;
  sort: CatalogSort;
};
export type CatalogUrlState = { filters: CatalogFilters; page: number };

export const NO_FILTERS: CatalogFilters = {
  q: '',
  category: '',
  subcategory: '',
  sort: 'name',
};
const SORTS: readonly CatalogSort[] = ['name', 'price_asc', 'price_desc'];

function text(value: string | null, max: number): string {
  return (value ?? '').trim().slice(0, max);
}

/**
 * Reads `?q=&cat=&sub=&sort=&pagina=`. Invalid or missing values fall back to "no filter" / name sort / page 1,
 * and `sub` is ignored without `cat`. Whether a price sort is allowed is decided by the API, not here.
 */
export function parseCatalogUrl(search: string): CatalogUrlState {
  const params = new URLSearchParams(search);
  const category = text(params.get('cat'), CATALOG_MAX_FILTER);
  const sort = params.get('sort') as CatalogSort;
  return {
    filters: {
      q: text(params.get('q'), CATALOG_MAX_QUERY),
      category,
      subcategory: category ? text(params.get('sub'), CATALOG_MAX_FILTER) : '',
      sort: SORTS.includes(sort) ? sort : 'name',
    },
    page: parsePageParam(search),
  };
}

/** Query string (with the leading "?", or "") for a state; empty and default values are omitted. Other params are kept. */
export function buildCatalogSearch(current: string, state: CatalogUrlState): string {
  const params = new URLSearchParams(current);
  const { filters, page } = state;
  const set = (key: string, value: string, omit = '') => (value && value !== omit ? params.set(key, value) : params.delete(key));
  set('q', filters.q);
  set('cat', filters.category);
  set('sub', filters.category ? filters.subcategory : '');
  set('sort', filters.sort, 'name');
  set('pagina', page > 1 ? String(page) : '');
  const out = params.toString();
  return out ? `?${out}` : '';
}

/** Number of active filters (search, category, subcategory); sort does not count. */
export function countActiveFilters(f: CatalogFilters): number {
  return [f.q, f.category, f.subcategory].filter((v) => v !== '').length;
}

export type CategoryRow = {
  name: string;
  count: number;
  subcategories: string[];
};

/** Rows for the category list: empty categories hidden, Spanish alphabetical order, plus the grand total. */
export function prepareCategories(rows: readonly CategoryRow[]): {
  rows: CategoryRow[];
  total: number;
} {
  const visible = rows.filter((r) => r.count > 0).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return {
    rows: visible.map((r) => ({
      ...r,
      subcategories: [...r.subcategories].sort((a, b) => a.localeCompare(b, 'es')),
    })),
    total: visible.reduce((sum, r) => sum + r.count, 0),
  };
}
