import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import styles from './CatalogHead.module.css';
import { SearchField } from './SearchField';

type Props = { titleId: string; q: string; onSearch: (q: string) => void };

/** Section header: title and subtitle on the left, the search field on the right (stacked on phones). */
export function CatalogHead({ titleId, q, onSearch }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <h2 id={titleId} className={styles.title}>
          {copy.title}
        </h2>
        <p className={styles.intro}>{copy.intro}</p>
      </div>
      <div className={styles.search}>
        <SearchField
          id="catalogo-q"
          value={q}
          label={copy.filters.searchLabel}
          placeholder={copy.filters.searchPlaceholder}
          clearLabel={copy.filters.searchClear}
          onCommit={onSearch}
        />
      </div>
    </div>
  );
}
