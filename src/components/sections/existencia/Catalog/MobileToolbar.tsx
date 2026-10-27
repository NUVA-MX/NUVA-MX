'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { countActiveFilters, type CatalogFilters } from '@/lib/catalog/url';
import type { CatalogSort } from '@/lib/catalog/types';
import { fillTemplate } from '@/lib/format';
import { SearchField } from './SearchField';
import { SortSelect } from './SortSelect';
import styles from './MobileToolbar.module.css';

type Props = {
  filters: CatalogFilters;
  priceSort: boolean;
  onSearch: (q: string) => void;
  onSort: (sort: CatalogSort) => void;
  onOpenFilters: () => void;
  sheetOpen: boolean;
};

/** Phones and tablets: search on top, then the "Filtros" button (with a count) and the sort select, 50% each. Sticky. */
export function MobileToolbar({ filters, priceSort, onSearch, onSort, onOpenFilters, sheetOpen }: Props) {
  const f = copy.filters;
  const n = countActiveFilters(filters);
  return (
    <div className={styles.root}>
      <SearchField
        id="catalogo-q-movil"
        value={filters.q}
        label={f.searchLabel}
        placeholder={f.searchPlaceholder}
        clearLabel={f.searchClear}
        onCommit={onSearch}
      />
      <div className={styles.row}>
        <button
          type="button"
          className={styles.filters}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={n > 0 ? fillTemplate(f.openWithCount, { n }) : undefined}
          onClick={onOpenFilters}
        >
          {f.open}
          {n > 0 && (
            <span className={styles.badge} aria-hidden="true">
              {n}
            </span>
          )}
        </button>
        <SortSelect id="catalogo-orden-movil" value={filters.sort} priceSort={priceSort} onChange={onSort} />
      </div>
    </div>
  );
}
