'use client';

import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import type { CatalogCategoriesResponse } from '@/lib/catalog/types';
import type { CatalogFilters as Filters, CatalogSort } from '@/lib/useCatalog';
import { CategoryChips } from './CategoryChips';
import styles from './CatalogFilters.module.css';

export type CatalogFilterLabels = {
  groupLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  chipsLabel: string;
  sortLabel: string;
  sort: Record<CatalogSort, string>;
  subcategoryLabel: string;
  allCategories: string;
  allSubcategories: string;
};

type Props = {
  value: Filters;
  categories: CatalogCategoriesResponse['categories'];
  labels: CatalogFilterLabels;
  /** Price sorting is offered only when prices are visible. */
  priceSort: boolean;
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
export function CatalogFilters({ value, categories, labels, priceSort, onChange }: Props) {
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
      <CategoryChips
        categories={categories}
        value={value.category}
        label={labels.chipsLabel}
        allLabel={labels.allCategories}
        onChange={(category) => onChange({ ...value, category, subcategory: '' })}
      />
      <Field id="catalogo-subcategoria" label={labels.subcategoryLabel} className={styles.sub}>
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
      <Field id="catalogo-orden" label={labels.sortLabel} className={styles.sort}>
        <div className={styles.select}>
          <select
            id="catalogo-orden"
            value={value.sort}
            className={styles.control}
            onChange={(e) => onChange({ ...value, sort: e.target.value as CatalogSort })}
          >
            {(['name', 'price_asc', 'price_desc'] as const)
              .filter((k) => k === 'name' || priceSort || k === value.sort)
              .map((k) => (
                <option key={k} value={k}>
                  {labels.sort[k]}
                </option>
              ))}
          </select>
        </div>
      </Field>
    </div>
  );
}
