'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CategoryRow } from '@/lib/catalog/url';
import { cx } from '@/lib/cx';
import styles from './CategoryList.module.css';

type Props = {
  rows: readonly CategoryRow[];
  total: number;
  value: string;
  onSelect: (category: string) => void;
  /** Unique per instance (sidebar and sheet both render this list). */
  headingId: string;
};

/** Category filter: the "all" entry with the total, then each category with its count, as a list of buttons. */
export function CategoryList({ rows, total, value, onSelect, headingId }: Props) {
  const entries = [
    { name: '', label: copy.filters.allCategories, count: total },
    ...rows.map((r) => ({ name: r.name, label: r.name, count: r.count })),
  ];
  return (
    <div role="group" aria-labelledby={headingId} className={styles.root}>
      <h3 id={headingId} className={styles.heading}>
        {copy.filters.categoryHeading}
      </h3>
      <ul className={styles.list}>
        {entries.map((c) => (
          <li key={c.name}>
            <button type="button" aria-pressed={c.name === value} className={cx(styles.item, c.name === value && styles.on)} onClick={() => onSelect(c.name)}>
              <span className={styles.label}>{c.label}</span>
              <span className={styles.count}>{c.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
