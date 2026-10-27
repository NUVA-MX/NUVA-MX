'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogFilters, CategoryRow } from '@/lib/catalog/url';
import { CategoryList } from './CategoryList';
import { SearchField } from './SearchField';
import styles from './Sidebar.module.css';

type Props = {
  filters: CatalogFilters;
  rows: readonly CategoryRow[];
  total: number;
  onSearch: (q: string) => void;
  onSelect: (category: string, subcategory: string) => void;
};

/** Desktop filter column: search and the category list with its expanding subcategories. Sticky, scrolls on its own. */
export function Sidebar({ filters, rows, total, onSearch, onSelect }: Props) {
  const f = copy.filters;
  return (
    <aside className={styles.root} aria-label={f.sidebarLabel}>
      <SearchField
        id="catalogo-q"
        value={filters.q}
        label={f.searchLabel}
        placeholder={f.searchPlaceholder}
        clearLabel={f.searchClear}
        onCommit={onSearch}
      />
      <h3 className={styles.title}>{f.categoriesTitle}</h3>
      <CategoryList rows={rows} total={total} category={filters.category} subcategory={filters.subcategory} onSelect={onSelect} />
    </aside>
  );
}
