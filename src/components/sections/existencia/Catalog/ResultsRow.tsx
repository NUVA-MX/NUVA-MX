import type { ReactNode } from 'react';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogFilters } from '@/lib/catalog/url';
import styles from './ResultsRow.module.css';

type Props = {
  /** Null while there is nothing to count (loading, error). */
  total: number | null;
  filters: CatalogFilters;
  priceVisible: boolean;
  /** Filters button (phones) on the left, before the count. */
  leading?: ReactNode;
  /** Sort control, on the right. */
  children?: ReactNode;
};

/** Toolbar: "N productos · category" on the left (with the Filtros button on phones), the sort select on the right. */
export function ResultsRow({ total, filters, priceVisible, leading, children }: Props) {
  const [before, after] = (total === 1 ? copy.count.one : copy.count.other).split('{n}');
  const scope = [filters.category, filters.subcategory].filter(Boolean).join(' / ');
  return (
    <div className={styles.root}>
      {leading}
      <div className={styles.summary}>
        <p className={styles.count} aria-live="polite">
          {total !== null && (
            <>
              {before}
              <strong className={styles.number}>{total}</strong>
              {after}
              {scope && ` · ${scope}`}
            </>
          )}
        </p>
        {priceVisible && <p className={styles.note}>{copy.priceNote}</p>}
      </div>
      {children && <div className={styles.sort}>{children}</div>}
    </div>
  );
}
