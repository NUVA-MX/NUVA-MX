'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogSort } from '@/lib/catalog/types';
import styles from './SortSelect.module.css';

type Props = {
  id: string;
  value: CatalogSort;
  /** Price options are offered only when prices are visible. */
  priceSort: boolean;
  onChange: (sort: CatalogSort) => void;
};

const OPTIONS = ['name', 'price_asc', 'price_desc'] as const;

/** "Ordenar" select. A price option that is already selected stays in the list so the select is never blank. */
export function SortSelect({ id, value, priceSort, onChange }: Props) {
  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {copy.filters.sortLabel}
      </label>
      <select id={id} value={value} className={styles.select} onChange={(e) => onChange(e.target.value as CatalogSort)}>
        {OPTIONS.filter((k) => k === 'name' || priceSort || k === value).map((k) => (
          <option key={k} value={k}>
            {copy.filters.sort[k]}
          </option>
        ))}
      </select>
    </div>
  );
}
