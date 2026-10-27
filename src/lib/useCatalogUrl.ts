'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { buildCatalogSearch, parseCatalogUrl, type CatalogFilters, type CatalogUrlState } from '@/lib/catalog/url';

const URL_EVENT = 'nuva:catalog-url';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(URL_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(URL_EVENT, onChange);
  };
}

/** Writes the state to the address bar. `push` creates a history entry (Back restores it); `replace` does not. */
export function writeCatalogUrl(state: CatalogUrlState, mode: 'push' | 'replace'): void {
  const url = new URL(window.location.href);
  url.search = buildCatalogSearch(url.search, state);
  if (url.href === window.location.href) return;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
  window.dispatchEvent(new Event(URL_EVENT));
}

export type CatalogUrl = CatalogUrlState & {
  /** Changes some filters and goes back to page 1. */
  update: (patch: Partial<CatalogFilters>, mode?: 'push' | 'replace') => void;
  clearAll: () => void;
  goTo: (page: number) => void;
};

/** Filters, sort and page live in the address (`?q=&cat=&sub=&sort=&pagina=`), so reloads, shared links and Back work. */
export function useCatalogUrl(): CatalogUrl {
  // The server render always sees the unfiltered first page.
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => '',
  );
  const state = useMemo(() => parseCatalogUrl(search), [search]);

  const update = useCallback(
    (patch: Partial<CatalogFilters>, mode: 'push' | 'replace' = 'push') => {
      writeCatalogUrl({ filters: { ...state.filters, ...patch }, page: 1 }, mode);
    },
    [state.filters],
  );
  const clearAll = useCallback(
    () =>
      writeCatalogUrl(
        {
          filters: {
            q: '',
            category: '',
            subcategory: '',
            sort: state.filters.sort,
          },
          page: 1,
        },
        'push',
      ),
    [state.filters.sort],
  );
  const goTo = useCallback((page: number) => writeCatalogUrl({ filters: state.filters, page }, 'push'), [state.filters]);

  return { ...state, update, clearAll, goTo };
}
