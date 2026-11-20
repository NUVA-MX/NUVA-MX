'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/primitives/Icon';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CategoryRow } from '@/lib/catalog/url';
import { CategoryList } from './CategoryList';
import styles from './FilterSheet.module.css';

type Props = {
  rows: readonly CategoryRow[];
  total: number;
  category: string;
  onApply: (category: string) => void;
};

/** Phone/tablet filters: a "Filtros" button that opens a bottom sheet with the same list; "Aplicar" commits the choice. */
export function FilterSheet({ rows, total, category, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const f = copy.filters;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button type="button" className={styles.trigger} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Icon name="filter" />
        {f.filtersButton}
      </button>
      <dialog
        ref={dialog}
        className={styles.sheet}
        aria-labelledby="catalogo-sheet-title"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        {open && (
          <SheetBody
            rows={rows}
            total={total}
            initial={category}
            onCancel={() => setOpen(false)}
            onApply={(next) => {
              onApply(next);
              setOpen(false);
            }}
          />
        )}
      </dialog>
    </>
  );
}

type BodyProps = { rows: readonly CategoryRow[]; total: number; initial: string; onCancel: () => void; onApply: (category: string) => void };

/** Mounted only while open, so the draft choice always starts from the applied category. */
function SheetBody({ rows, total, initial, onCancel, onApply }: BodyProps) {
  const [draft, setDraft] = useState(initial);
  return (
    <div className={styles.body}>
      <div className={styles.top}>
        <h2 id="catalogo-sheet-title" className={styles.title}>
          {copy.filters.filtersTitle}
        </h2>
        <button type="button" className={styles.close} aria-label={copy.filters.closeFilters} onClick={onCancel}>
          <Icon name="close" />
        </button>
      </div>
      <div className={styles.scroll}>
        <CategoryList rows={rows} total={total} value={draft} onSelect={setDraft} headingId="catalogo-sheet-cat" />
      </div>
      <button type="button" className={styles.apply} onClick={() => onApply(draft)}>
        {copy.filters.apply}
      </button>
    </div>
  );
}
