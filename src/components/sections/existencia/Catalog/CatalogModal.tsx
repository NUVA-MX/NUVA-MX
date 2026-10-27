'use client';

import { Modal } from '@/components/patterns/Modal';
import { StatusMessage } from '@/components/patterns/StatusMessage';
import { Icon } from '@/components/primitives/Icon';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { ui } from '@/content/ui';
import type { CatalogItemState } from '@/lib/useCatalogItem';
import { CatalogDetail } from './CatalogDetail';
import styles from './CatalogModal.module.css';

const TITLE_ID = 'catalogo-detalle-title';

type Props = { open: boolean; item: CatalogItemState; onClose: () => void };

/** Detail window: the product once loaded, otherwise a loading or error state with the same accessible title. */
export function CatalogModal({ open, item, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} theme="taller" rootClassName={styles.backdrop}>
      <div className={styles.closeBar}>
        <button type="button" className={styles.close} aria-label={ui.close} onClick={onClose}>
          <Icon name="close" size="md" />
        </button>
      </div>
      {item.status === 'success' && item.product ? (
        <CatalogDetail key={item.product.code} product={item.product} titleId={TITLE_ID} />
      ) : (
        <div className={styles.state}>
          {item.status === 'error' ? <StatusMessage tone="error" title={copy.detail.error.title} body={copy.detail.error.body} /> : null}
          <h2 id={TITLE_ID} className={styles.title}>
            {item.status === 'error' ? copy.detail.error.title : copy.detail.loading}
          </h2>
        </div>
      )}
    </Modal>
  );
}
