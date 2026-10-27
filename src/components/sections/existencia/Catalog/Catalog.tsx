'use client';

import { useRef, useState } from 'react';
import { CatalogCard } from '@/components/patterns/CatalogCard';
import { ProductSkeleton } from '@/components/patterns/ProductSkeleton';
import { StatusMessage } from '@/components/patterns/StatusMessage';
import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { cx } from '@/lib/cx';
import { fillTemplate } from '@/lib/format';
import { useCatalog, type CatalogFilters as Filters } from '@/lib/useCatalog';
import { useCatalogCategories } from '@/lib/useCatalogCategories';
import { useCatalogItem } from '@/lib/useCatalogItem';
import styles from './Catalog.module.css';
import { CatalogFilters } from './CatalogFilters';
import { CatalogModal } from './CatalogModal';
import { Pagination } from './Pagination';
import { useCatalogToggle } from './useCatalogToggle';

const SKELETONS = 8;
const TITLE_ID = 'catalogo-title';
const NO_FILTERS: Filters = { q: '', category: '', subcategory: '' };

function countText(total: number): string {
  return fillTemplate(total === 1 ? copy.count.one : copy.count.other, { n: total });
}

/** Supplier catalog on /existencia: search, filters, numbered-page grid and a detail window. Hidden when the API says it is off. */
export function Catalog() {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const categories = useCatalogCategories();
  const list = useCatalog(filters);
  const item = useCatalogItem(openCode);
  const { inList, toggle } = useCatalogToggle(setOpenCode);
  const sectionRef = useRef<HTMLElement>(null);
  const filtered = filters.q !== '' || filters.category !== '' || filters.subcategory !== '';

  if (list.status !== 'loading' && !list.enabled) return null;

  // Focusing the section brings its top into view, so a new page starts at the title instead of the old scroll position.
  function onPage(page: number) {
    list.goTo(page);
    sectionRef.current?.focus();
  }

  function onRetry() {
    sectionRef.current?.focus();
    list.retry();
  }

  const clear = (
    <button type="button" className={styles.clear} onClick={() => setFilters(NO_FILTERS)}>
      {copy.filters.clear}
    </button>
  );

  return (
    <section ref={sectionRef} tabIndex={-1} id="catalogo" className={styles.root} aria-labelledby={TITLE_ID} aria-busy={list.status === 'loading'}>
      <Container>
        <h2 id={TITLE_ID} className={styles.title}>
          {copy.title}
        </h2>
        <p className={styles.intro}>{copy.intro}</p>
        <CatalogFilters value={filters} categories={categories} labels={copy.filters} onChange={setFilters} />
        <div className={styles.bar}>
          <p className={styles.count} aria-live="polite">
            {list.status === 'success' ? countText(list.total) : ''}
          </p>
          {filtered && list.status !== 'empty' && clear}
        </div>

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
          <p className={styles.empty} role="status">
            {filtered ? copy.empty : copy.emptyCatalog}
            {filtered && clear}
          </p>
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
                <CatalogCard key={card.code} card={card} labels={copy.card} inList={inList(card.code)} onToggle={toggle} onOpen={setOpenCode} />
              ))}
            </div>
            <Pagination page={list.page} totalPages={list.totalPages} onPage={onPage} />
          </>
        )}
      </Container>
      <CatalogModal open={openCode !== null} item={item} onClose={() => setOpenCode(null)} />
    </section>
  );
}
