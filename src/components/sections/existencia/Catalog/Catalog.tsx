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
import { useCatalogUrl } from '@/lib/useCatalogUrl';
import { ActiveFilters } from './ActiveFilters';
import styles from './Catalog.module.css';
import { CatalogModal } from './CatalogModal';
import { FilterSheet } from './FilterSheet';
import { MobileToolbar } from './MobileToolbar';
import { Pagination } from './Pagination';
import { ResultsBar } from './ResultsBar';
import { Sidebar } from './Sidebar';
import { useCatalogToggle } from './useCatalogToggle';

const SKELETONS = 8;
const TITLE_ID = 'catalogo-title';

/** Supplier catalog on /existencia: sidebar (or filter sheet on phones), results bar, numbered-page grid and a detail window. */
export function Catalog() {
  const url = useCatalogUrl();
  const { filters } = url;
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const categories = useCatalogCategories();
  const list = useCatalog(filters, url.page);
  const item = useCatalogItem(openCode);
  const { inList, toggle } = useCatalogToggle(setOpenCode);
  const sectionRef = useRef<HTMLElement>(null);
  const { rows, total: allTotal } = useMemo(() => prepareCategories(categories), [categories]);
  const priceVisible = list.items.some((i) => i.price !== null);
  const filtered = filters.q !== '' || filters.category !== '' || filters.subcategory !== '';

  if (list.status !== 'loading' && !list.enabled) return null;

  // Focusing the section brings its top into view, so a change starts at the title instead of the old scroll position.
  const toTop = () => sectionRef.current?.focus({ preventScroll: false });
  const onSelect = (category: string, subcategory: string) => url.update({ category, subcategory });
  const onSearch = (q: string) => url.update({ q }, 'replace');
  const onRemove = (key: 'q' | 'category' | 'subcategory') => url.update(key === 'category' ? { category: '', subcategory: '' } : { [key]: '' });
  const onPage = (page: number) => {
    url.goTo(page);
    toTop();
  };
  const onRetry = () => {
    toTop();
    list.retry();
  };

  const clear = (
    <button type="button" className={styles.clear} onClick={url.clearAll}>
      {copy.filters.clear}
    </button>
  );
  const from = (url.page - 1) * CATALOG_PAGE_SIZE + 1;
  const to = from + list.items.length - 1;

  return (
    <section ref={sectionRef} tabIndex={-1} id="catalogo" className={styles.root} aria-labelledby={TITLE_ID} aria-busy={list.status === 'loading'}>
      <Container>
        <h2 id={TITLE_ID} className={styles.title}>
          {copy.title}
        </h2>
        <p className={styles.intro}>{copy.intro}</p>
        <div className={styles.layout}>
          <div className={styles.side}>
            <Sidebar filters={filters} rows={rows} total={allTotal} onSearch={onSearch} onSelect={onSelect} />
          </div>
          <div className={styles.main}>
            <div className={styles.toolbar}>
              <MobileToolbar
                filters={filters}
                priceSort={priceVisible}
                sheetOpen={sheetOpen}
                onSearch={onSearch}
                onSort={(sort) => url.update({ sort })}
                onOpenFilters={() => setSheetOpen(true)}
              />
            </div>
            <ResultsBar
              total={list.status === 'success' ? list.total : null}
              priceVisible={priceVisible}
              sort={filters.sort}
              onSort={(sort) => url.update({ sort })}
            />
            <ActiveFilters filters={filters} onRemove={onRemove} onClearAll={url.clearAll} />

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
                <Pagination page={url.page} totalPages={list.totalPages} onPage={onPage} />
                <p className={styles.showing}>
                  {fillTemplate(copy.count.showing, {
                    from,
                    to,
                    total: list.total,
                  })}
                </p>
              </>
            )}
          </div>
        </div>
      </Container>
      <FilterSheet
        open={sheetOpen}
        filters={filters}
        rows={rows}
        total={allTotal}
        resultCount={list.total}
        onSelect={onSelect}
        onClear={url.clearAll}
        onClose={() => setSheetOpen(false)}
      />
      <CatalogModal open={openCode !== null} item={item} onClose={() => setOpenCode(null)} />
    </section>
  );
}
