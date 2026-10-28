'use client';

import { Modal } from '@/components/patterns/Modal';
import { Icon } from '@/components/primitives/Icon';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { ui } from '@/content/ui';
import type { CatalogCard } from '@/lib/catalog/types';
import type { CatalogItemState } from '@/lib/useCatalogItem';
import { CatalogDetail } from './CatalogDetail';
import { CatalogShell } from './CatalogShell';
import styles from './CatalogModal.module.css';

const TITLE_ID = 'catalogo-detalle-title';

type Props = {
  open: boolean;
  item: CatalogItemState & { retry: () => void };
  /** The card that was clicked: shown at once while the detail loads. */
  preview: CatalogCard | null;
  onClose: () => void;
};

/** Detail window: opens at once with the card data, then swaps in the full product (or a short error with retry). */
export function CatalogModal({ open, item, preview, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} theme="taller" rootClassName={styles.backdrop}>
      <div className={styles.closeBar}>
        <button type="button" className={styles.close} aria-label={ui.close} onClick={onClose}>
          <Icon name="close" size="md" />
        </button>
      </div>
      {item.status === 'success' && item.product ? (
        <CatalogDetail key={item.product.code} product={item.product} titleId={TITLE_ID} />
      ) : preview ? (
        <CatalogShell card={preview} titleId={TITLE_ID} failed={item.status === 'error'} onRetry={item.retry} />
      ) : (
        <div className={styles.state}>
          <h2 id={TITLE_ID} className={styles.title}>
            {copy.detail.loading}
          </h2>
        </div>
      )}
    </Modal>
  );
}
