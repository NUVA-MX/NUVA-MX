'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogSort } from '@/lib/catalog/types';
import { fillTemplate } from '@/lib/format';
import { SortSelect } from './SortSelect';
import styles from './ResultsBar.module.css';

type Props = {
  /** Null while there is nothing to count (loading, error). */
  total: number | null;
  priceVisible: boolean;
  sort: CatalogSort;
  onSort: (sort: CatalogSort) => void;
};

/** Result count with the one-time customization note on the left, the sort select on the right (desktop). */
export function ResultsBar({ total, priceVisible, sort, onSort }: Props) {
  const label = total === 1 ? copy.count.one : copy.count.other;
  const [before, after] = fillTemplate(label, { n: '\u0000' }).split('\u0000');
  return (
    <div className={styles.root}>
      <p className={styles.count} aria-live="polite">
        {total !== null && (
          <>
            {before}
            <strong className={styles.number}>{total}</strong>
            {after}
            {priceVisible && ` · ${copy.count.note}`}
          </>
        )}
      </p>
      <div className={styles.sort}>
        <SortSelect id="catalogo-orden" value={sort} priceSort={priceVisible} onChange={onSort} />
      </div>
    </div>
  );
}
