'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CategoryRow } from '@/lib/catalog/url';
import { cx } from '@/lib/cx';
import styles from './CategoryChips.module.css';

type Props = {
  rows: readonly CategoryRow[];
  total: number;
  value: string;
  onSelect: (category: string) => void;
};

/** One scrollable row of pill chips: "Todas" with the total, then each category with its count. */
export function CategoryChips({ rows, total, value, onSelect }: Props) {
  const chips = [
    { name: '', label: copy.filters.allCategories, count: total },
    ...rows.map((r) => ({ name: r.name, label: r.name, count: r.count })),
  ];
  return (
    <div role="group" aria-label={copy.filters.categoriesLabel} className={styles.root}>
      {chips.map((c) => (
        <button
          key={c.name}
          type="button"
          aria-pressed={c.name === value}
          className={cx(styles.chip, c.name === value && styles.on)}
          onClick={() => onSelect(c.name)}
        >
          <span>{c.label}</span>
          <span className={styles.badge}>{c.count}</span>
        </button>
      ))}
    </div>
  );
}
