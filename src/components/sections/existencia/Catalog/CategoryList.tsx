'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CategoryRow } from '@/lib/catalog/url';
import { cx } from '@/lib/cx';
import styles from './CategoryList.module.css';

type Props = {
  rows: readonly CategoryRow[];
  total: number;
  category: string;
  subcategory: string;
  /** Taller rows for touch (the filter sheet). */
  touch?: boolean;
  onSelect: (category: string, subcategory: string) => void;
};

/** "Todas" plus one row per category with its count; the active category expands its subcategories below it. */
export function CategoryList({ rows, total, category, subcategory, touch = false, onSelect }: Props) {
  return (
    <ul className={cx(styles.root, touch && styles.touch)}>
      <li>
        <button
          type="button"
          className={cx(styles.row, category === '' && styles.active)}
          aria-current={category === '' ? 'true' : undefined}
          onClick={() => onSelect('', '')}
        >
          <span className={styles.name}>{copy.filters.allCategories}</span>
          <span className={styles.count}>{total}</span>
        </button>
      </li>
      {rows.map((row) => {
        const active = row.name === category;
        return (
          <li key={row.name}>
            <button
              type="button"
              className={cx(styles.row, active && styles.active)}
              aria-current={active ? 'true' : undefined}
              aria-expanded={row.subcategories.length > 0 ? active : undefined}
              onClick={() => onSelect(active ? '' : row.name, '')}
            >
              <span className={styles.name}>{row.name}</span>
              <span className={styles.count}>{row.count}</span>
            </button>
            {active && row.subcategories.length > 0 && (
              <div className={styles.expand}>
                <ul className={styles.subs}>
                  {row.subcategories.map((sub) => (
                    <li key={sub}>
                      <button
                        type="button"
                        className={cx(styles.sub, sub === subcategory && styles.subActive)}
                        aria-current={sub === subcategory ? 'true' : undefined}
                        onClick={() => onSelect(row.name, sub === subcategory ? '' : sub)}
                      >
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
