import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { fillTemplate } from '@/lib/format';
import { pageWindow } from '@/lib/catalog/pagination';
import { cx } from '@/lib/cx';
import styles from './Pagination.module.css';

type Props = { page: number; totalPages: number; onPage: (page: number) => void };

/** Numbered pages with previous/next. Renders nothing when everything fits on one page. */
export function Pagination({ page, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null;
  const p = copy.pagination;
  return (
    <nav className={styles.root} aria-label={p.label}>
      <button type="button" className={styles.step} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {p.prev}
      </button>
      <ol className={styles.list}>
        {pageWindow(page, totalPages).map((slot, i) =>
          slot === 'gap' ? (
            <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={slot}>
              <button
                type="button"
                className={cx(styles.num, slot === page && styles.current)}
                aria-current={slot === page ? 'page' : undefined}
                aria-label={fillTemplate(p.pageAria, { n: slot })}
                onClick={() => slot !== page && onPage(slot)}
              >
                {slot}
              </button>
            </li>
          ),
        )}
      </ol>
      <button type="button" className={styles.step} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        {p.next}
      </button>
    </nav>
  );
}
