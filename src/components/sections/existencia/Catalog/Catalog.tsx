'use client';

import { useMemo, useRef, useState } from 'react';
import { CatalogCard } from '@/components/patterns/CatalogCard';
import { ProductSkeleton } from '@/components/patterns/ProductSkeleton';
import { StatusMessage } from '@/components/patterns/StatusMessage';
import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { prepareCategories } from '@/lib/catalog/url';
import { cx } from '@/lib/cx';
import { fillTemplate } from '@/lib/format';
import { CATALOG_PAGE_SIZE, useCatalog } from '@/lib/useCatalog';
import { useCatalogCategories } from '@/lib/useCatalogCategories';
import { useCatalogItem } from '@/lib/useCatalogItem';
import { catalogItems } from '@/lib/catalogItemCache';
import { useCatalogUrl } from '@/lib/useCatalogUrl';
import styles from './Catalog.module.css';
import { CatalogModal } from './CatalogModal';
import { CategoryChips } from './CategoryChips';
import { Pagination } from './Pagination';
import { ResultsRow } from './ResultsRow';
import { SearchField } from './SearchField';
import { SortSelect } from './SortSelect';
import { useCatalogToggle } from './useCatalogToggle';

const SKELETONS = 8;
const TITLE_ID = 'catalogo-title';

/** Supplier catalog on /existencia: header with search and sort, category chips, results row, grid and a detail window. */
export function Catalog() {
  const url = useCatalogUrl();
  const { filters } = url;
  const [openCode, setOpenCode] = useState<string | null>(null);
  const categories = useCatalogCategories();
  const list = useCatalog(filters, url.page);
  const item = useCatalogItem(openCode);
  const { qtyOf, add, setQty } = useCatalogToggle(setOpenCode);
  const sectionRef = useRef<HTMLElement>(null);
  const { rows, total: allTotal } = useMemo(() => prepareCategories(categories), [categories]);
  const priceVisible = list.items.some((i) => i.price !== null);
  const filtered = filters.q !== '' || filters.category !== '' || filters.subcategory !== '';

  if (list.status !== 'loading' && !list.enabled) return null;

  // Focusing the section brings its top into view, so a change starts at the title instead of the old scroll position.
  const toTop = () => sectionRef.current?.focus();
  const onPage = (page: number) => {
    url.goTo(page);
    toTop();
  };
  const onRetry = () => {
    toTop();
    list.retry();
  };
  const from = (url.page - 1) * CATALOG_PAGE_SIZE + 1;

  return (
    <section ref={sectionRef} tabIndex={-1} id="catalogo" className={styles.root} aria-labelledby={TITLE_ID} aria-busy={list.status === 'loading'}>
      <Container>
        <div className={styles.head}>
          <div className={styles.heading}>
            <h2 id={TITLE_ID} className={styles.title}>
              {copy.title}
            </h2>
            <p className={styles.intro}>{copy.intro}</p>
          </div>
          <div className={styles.tools}>
            <div className={styles.search}>
              <SearchField
                id="catalogo-q"
                value={filters.q}
                label={copy.filters.searchLabel}
                placeholder={copy.filters.searchPlaceholder}
                clearLabel={copy.filters.searchClear}
                onCommit={(q) => url.update({ q }, 'replace')}
              />
            </div>
            <div className={styles.sort}>
              <SortSelect id="catalogo-orden" value={filters.sort} priceSort={priceVisible} onChange={(sort) => url.update({ sort })} />
            </div>
          </div>
        </div>
        <CategoryChips rows={rows} total={allTotal} value={filters.category} onSelect={(category) => url.update({ category, subcategory: '' })} />
        <ResultsRow total={list.status === 'success' ? list.total : null} filters={filters} priceVisible={priceVisible} />

        {list.status === 'loading' && (
          <>
            <VisuallyHidden>{copy.loading}</VisuallyHidden>
            <div className={styles.grid}>
              {Array.from({ length: SKELETONS }, (_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {list.status === 'empty' && (
          <div className={styles.empty} role="status">
            <p>{filtered ? copy.empty : copy.emptyCatalog}</p>
            {filtered && (
              <button type="button" className={styles.clear} onClick={url.clearAll}>
                {copy.filters.clear}
              </button>
            )}
          </div>
        )}

        {list.status === 'error' && (
          <StatusMessage
            tone="error"
            title={copy.error.title}
            body={copy.error.body}
            action={
              <Button variant="secondary" onClick={onRetry}>
                {copy.error.retry}
              </Button>
            }
          />
        )}

        {list.status === 'success' && (
          <>
            <div className={cx(styles.grid, list.pending && styles.pending)} aria-busy={list.pending}>
              {list.items.map((card) => (
                <CatalogCard
                  key={card.code}
                  card={card}
                  labels={copy.card}
                  qty={qtyOf(card.code)}
                  onAdd={add}
                  onSetQty={setQty}
                  onOpen={setOpenCode}
                  prefetch={catalogItems}
                />
              ))}
            </div>
            <Pagination page={url.page} totalPages={list.totalPages} onPage={onPage} />
            <p className={styles.showing}>{fillTemplate(copy.count.showing, { from, to: from + list.items.length - 1, total: list.total })}</p>
          </>
        )}
      </Container>
      <CatalogModal
        open={openCode !== null}
        item={item}
        preview={list.items.find((c) => c.code === openCode) ?? null}
        onClose={() => setOpenCode(null)}
      />
    </section>
  );
}
