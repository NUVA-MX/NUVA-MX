'use client';

import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import type { CatalogCategoriesResponse } from '@/lib/catalog/types';
import type { CatalogFilters as Filters } from '@/lib/useCatalog';
import styles from './CatalogFilters.module.css';

export type CatalogFilterLabels = {
  groupLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  categoryLabel: string;
  subcategoryLabel: string;
  allCategories: string;
  allSubcategories: string;
};

type Props = {
  value: Filters;
  categories: CatalogCategoriesResponse['categories'];
  labels: CatalogFilterLabels;
  onChange: (next: Filters) => void;
};

function Field({ id, label, className, children }: { id: string; label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Search box plus category and dependent subcategory selects. Every control has a visible label. */
export function CatalogFilters({ value, categories, labels, onChange }: Props) {
  const subcategories = categories.find((c) => c.name === value.category)?.subcategories ?? [];
  return (
    <div role="group" aria-label={labels.groupLabel} className={styles.root}>
      <Field id="catalogo-q" label={labels.searchLabel} className={styles.search}>
        <input
          id="catalogo-q"
          type="search"
          value={value.q}
          maxLength={60}
          autoComplete="off"
          placeholder={labels.searchPlaceholder}
          className={styles.control}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
        />
      </Field>
      <Field id="catalogo-categoria" label={labels.categoryLabel}>
        <div className={styles.select}>
          <select
            id="catalogo-categoria"
            value={value.category}
            className={styles.control}
            onChange={(e) => onChange({ ...value, category: e.target.value, subcategory: '' })}
          >
            <option value="">{labels.allCategories}</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Field>
      <Field id="catalogo-subcategoria" label={labels.subcategoryLabel}>
        <div className={styles.select}>
          <select
            id="catalogo-subcategoria"
            value={value.subcategory}
            disabled={subcategories.length === 0}
            className={styles.control}
            onChange={(e) => onChange({ ...value, subcategory: e.target.value })}
          >
            <option value="">{labels.allSubcategories}</option>
            {subcategories.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Field>
    </div>
  );
}
