'use client';

import { Icon } from '@/components/primitives/Icon';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogFilters } from '@/lib/catalog/url';
import { fillTemplate } from '@/lib/format';
import styles from './ActiveFilters.module.css';

type Props = {
  filters: CatalogFilters;
  onRemove: (key: 'q' | 'category' | 'subcategory') => void;
  onClearAll: () => void;
};

/** One removable pill per active filter plus "Limpiar todo". Renders nothing when no filter is active. */
export function ActiveFilters({ filters, onRemove, onClearAll }: Props) {
  const chips = [
    { key: 'category', label: filters.category },
    { key: 'subcategory', label: filters.subcategory },
    { key: 'q', label: filters.q ? `“${filters.q}”` : '' },
  ] as const;
  const active = chips.filter((c) => c.label !== '');
  if (active.length === 0) return null;
  return (
    <ul className={styles.root} aria-label={copy.filters.activeLabel}>
      {active.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            className={styles.chip}
            aria-label={fillTemplate(copy.filters.removeFilter, {
              name: c.label,
            })}
            onClick={() => onRemove(c.key)}
          >
            <span className={styles.label}>{c.label}</span>
            <Icon name="close" size="sm" />
          </button>
        </li>
      ))}
      <li>
        <button type="button" className={styles.clear} onClick={onClearAll}>
          {copy.filters.clearAll}
        </button>
      </li>
    </ul>
  );
}
