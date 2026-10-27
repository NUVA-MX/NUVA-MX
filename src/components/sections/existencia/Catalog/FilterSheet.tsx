'use client';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/primitives/Icon';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { countActiveFilters, type CatalogFilters, type CategoryRow } from '@/lib/catalog/url';
import { fillTemplate } from '@/lib/format';
import { CategoryList } from './CategoryList';
import styles from './FilterSheet.module.css';

const TITLE_ID = 'catalogo-filtros-title';

type Props = {
  open: boolean;
  filters: CatalogFilters;
  rows: readonly CategoryRow[];
  total: number;
  /** Live result count for the "Ver {n} productos" button. */
  resultCount: number;
  onSelect: (category: string, subcategory: string) => void;
  onClear: () => void;
  onClose: () => void;
};

function applyLabel(n: number): string {
  if (n === 0) return copy.filters.sheetApplyNone;
  return n === 1 ? copy.filters.sheetApplyOne : fillTemplate(copy.filters.sheetApply, { n });
}

/** Mobile/tablet filter sheet (dialog with focus trap, Esc and scroll lock): categories, "Limpiar" and "Ver {n} productos". */
export function FilterSheet({ open, filters, rows, total, resultCount, onSelect, onClear, onClose }: Props) {
  const f = copy.filters;
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} placement="side" theme="taller" className={styles.box} rootClassName={styles.backdrop}>
      <header className={styles.header}>
        <h2 id={TITLE_ID} className={styles.title}>
          {f.sheetTitle}
        </h2>
        <button type="button" className={styles.close} aria-label={f.sheetClose} onClick={onClose}>
          <Icon name="close" size="md" />
        </button>
      </header>
      <div className={styles.body}>
        <CategoryList rows={rows} total={total} category={filters.category} subcategory={filters.subcategory} touch onSelect={onSelect} />
      </div>
      <footer className={styles.footer}>
        <button type="button" className={styles.clear} disabled={countActiveFilters(filters) === 0} onClick={onClear}>
          {f.clearShort}
        </button>
        <Button onClick={onClose} className={styles.apply}>
          {applyLabel(resultCount)}
        </Button>
      </footer>
    </Modal>
  );
}
