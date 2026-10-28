import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogFilters } from '@/lib/catalog/url';
import styles from './ResultsRow.module.css';

type Props = {
  /** Null while there is nothing to count (loading, error). */
  total: number | null;
  filters: CatalogFilters;
  priceVisible: boolean;
};

/** Result count and active category on the left; the "prices before customization" note on the right when prices show. */
export function ResultsRow({ total, filters, priceVisible }: Props) {
  const [before, after] = (total === 1 ? copy.count.one : copy.count.other).split('{n}');
  const scope = [filters.category, filters.subcategory].filter(Boolean).join(' / ');
  return (
    <div className={styles.root}>
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
  );
}
