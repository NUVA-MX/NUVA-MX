'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { fetchCatalogList } from '@/lib/api/catalog';
import { parsePageParam } from '@/lib/catalog/pagination';
import type { CatalogCard } from '@/lib/catalog/types';

export type CatalogSort = 'name' | 'price_asc' | 'price_desc';
export type CatalogFilters = { q: string; category: string; subcategory: string; sort: CatalogSort };
export type CatalogStatus = 'loading' | 'success' | 'empty' | 'error';

type State = {
  items: CatalogCard[];
  total: number;
  enabled: boolean;
  updatedAt: string | null;
  status: CatalogStatus;
  /** A page change is in flight; the previous page stays on screen meanwhile. */
  pending: boolean;
};

export const CATALOG_PAGE_SIZE = 24;
const DEBOUNCE_MS = 300;
const initial: State = { items: [], total: 0, enabled: true, updatedAt: null, status: 'loading', pending: false };

type Result = State & { page: number; totalPages: number; goTo: (page: number) => void; retry: () => void };

function sameQuery(a: CatalogFilters, b: CatalogFilters): boolean {
  return a.q === b.q && a.category === b.category && a.subcategory === b.subcategory && a.sort === b.sort;
}

const PAGE_EVENT = 'nuva:catalog-page';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(PAGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(PAGE_EVENT, onChange);
  };
}

/** Writes `?pagina=N` (no param for page 1) so the browser Back button returns to the previous page. */
function writePageParam(page: number, mode: 'push' | 'replace'): void {
  const url = new URL(window.location.href);
  if (page > 1) url.searchParams.set('pagina', String(page));
  else url.searchParams.delete('pagina');
  if (url.href === window.location.href) return;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
  window.dispatchEvent(new Event(PAGE_EVENT));
}

/**
 * Catalog list, one numbered page at a time: the search text is debounced (300 ms), a new query goes back to page 1,
 * `goTo` replaces the page, and any in-flight request is aborted when a newer one starts. The page number lives in
 * the URL (`?pagina=N`). `retry()` repeats the last request after an error.
 */
export function useCatalog(filters: CatalogFilters): Result {
  const [state, setState] = useState<State>(initial);
  const [query, setQuery] = useState(filters);
  const [attempt, setAttempt] = useState(0);
  // The page comes from the address (shared link, reload, Back); the server render always sees page 1.
  const page = parsePageParam(useSyncExternalStore(subscribe, () => window.location.search, () => ''));
  const applied = useRef(query);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = { q: filters.q.trim(), category: filters.category, subcategory: filters.subcategory, sort: filters.sort };
      if (sameQuery(next, applied.current)) return;
      applied.current = next;
      setQuery(next);
      writePageParam(1, 'replace');
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.q, filters.category, filters.subcategory, filters.sort]);

  useEffect(() => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    fetchCatalogList({ ...query, page, pageSize: CATALOG_PAGE_SIZE }, ctrl.signal)
      .then((res) => {
        // A shared link can point past the last page; fall back to page 1 instead of showing "no results".
        if (!res.items.length && res.total > 0 && page > 1) {
          writePageParam(1, 'replace');
          return;
        }
        setState({
          items: res.items,
          total: res.total,
          enabled: res.enabled,
          updatedAt: res.updatedAt,
          status: res.items.length ? 'success' : 'empty',
          pending: false,
        });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        console.warn('[useCatalog]', err);
        setState((prev) => ({ ...prev, items: [], status: 'error', pending: false }));
      });
    return () => ctrl.abort();
  }, [query, page, attempt]);

  const goTo = useCallback((next: number) => {
    setState((prev) => ({ ...prev, pending: true }));
    writePageParam(next, 'push');
  }, []);

  const retry = useCallback(() => {
    setState((prev) => ({ ...initial, enabled: prev.enabled }));
    setAttempt((n) => n + 1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(state.total / CATALOG_PAGE_SIZE));
  return { ...state, page, totalPages, goTo, retry };
}
