'use client';

import { useCallback, useEffect, useState } from 'react';
import { CatalogError, fetchCatalogList } from '@/lib/api/catalog';
import type { CatalogCard } from '@/lib/catalog/types';
import type { CatalogFilters } from '@/lib/catalog/url';
import { writeCatalogUrl } from '@/lib/useCatalogUrl';

export type { CatalogFilters } from '@/lib/catalog/url';
export type CatalogStatus = 'loading' | 'success' | 'empty' | 'error';

type State = {
  items: CatalogCard[];
  total: number;
  enabled: boolean;
  updatedAt: string | null;
  status: CatalogStatus;
  /** Request key the items belong to; a different current key means a change is in flight. */
  key: string;
};

export const CATALOG_PAGE_SIZE = 24;
const initial: State = { items: [], total: 0, enabled: true, updatedAt: null, status: 'loading', key: '' };

type Result = Omit<State, 'key'> & {
  /** A change is in flight; the previous results stay on screen meanwhile. */
  pending: boolean;
  totalPages: number;
  retry: () => void;
};

/**
 * Catalog list, one numbered page at a time, for the filters and page given (they come from the address, see
 * `useCatalogUrl`). Any in-flight request is aborted when a newer one starts. If the API refuses a price sort
 * (prices are off) the sort falls back to name and the param is dropped. `retry()` repeats the last request.
 */
export function useCatalog(filters: CatalogFilters, page: number): Result {
  const [state, setState] = useState<State>(initial);
  const [attempt, setAttempt] = useState(0);
  const { q, category, subcategory, sort } = filters;
  const key = [q, category, subcategory, sort, page, attempt].join('|');

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCatalogList({ q, category, subcategory, sort, page, pageSize: CATALOG_PAGE_SIZE }, ctrl.signal)
      .then((res) => {
        // A shared link can point past the last page; fall back to page 1 instead of showing "no results".
        if (!res.items.length && res.total > 0 && page > 1) {
          writeCatalogUrl({ filters: { q, category, subcategory, sort }, page: 1 }, 'replace');
          return;
        }
        setState({
          items: res.items,
          total: res.total,
          enabled: res.enabled,
          updatedAt: res.updatedAt,
          status: res.items.length ? 'success' : 'empty',
          key,
        });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof CatalogError && err.status === 400 && sort !== 'name') {
          writeCatalogUrl({ filters: { q, category, subcategory, sort: 'name' }, page }, 'replace');
          return;
        }
        console.warn('[useCatalog]', err);
        setState((prev) => ({ ...prev, items: [], status: 'error', key }));
      });
    return () => ctrl.abort();
  }, [q, category, subcategory, sort, page, attempt, key]);

  const retry = useCallback(() => {
    setState((prev) => ({ ...initial, enabled: prev.enabled }));
    setAttempt((n) => n + 1);
  }, []);

  const { key: settled, ...rest } = state;
  const pending = state.status !== 'loading' && settled !== key;
  return { ...rest, pending, totalPages: Math.max(1, Math.ceil(state.total / CATALOG_PAGE_SIZE)), retry };
}
