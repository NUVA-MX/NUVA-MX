'use client';

import type { CatalogCategoriesResponse } from '@/lib/catalog/types';
import { cx } from '@/lib/cx';
import styles from './CategoryChips.module.css';

type Props = {
  categories: CatalogCategoriesResponse['categories'];
  value: string;
  label: string;
  allLabel: string;
  onChange: (category: string) => void;
};

/** Category quick filter: "Todas" plus one toggle chip per category. Scrolls sideways on phones. */
export function CategoryChips({ categories, value, label, allLabel, onChange }: Props) {
  const options = [{ name: '', label: allLabel }, ...categories.map((c) => ({ name: c.name, label: c.name }))];
  return (
    <div role="group" aria-label={label} className={styles.root}>
      {options.map((o) => (
        <button
          key={o.name}
          type="button"
          aria-pressed={o.name === value}
          className={cx(styles.chip, o.name === value && styles.on)}
          onClick={() => onChange(o.name)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
