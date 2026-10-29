'use client';

import { useId } from 'react';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/primitives/Icon';
import { Modal } from '../Modal';
import { CartPanelRow } from './CartPanelRow';
import styles from './CartPanel.module.css';

export type CartPanelItem = {
  id: string;
  name: string;
  qty: number;
  /** Already formatted line price, or the "no price" text. */
  priceLabel: string;
  max: number | null;
};

export type CartPanelLabels = {
  title: string;
  empty: string;
  total: string;
  send: string;
  note: string;
  close: string;
  remove: string;
  removeAria: string;
  qty: string;
  increase: string;
  decrease: string;
  noticesTitle: string;
  verifying: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: readonly CartPanelItem[];
  /** Formatted subtotal; the row is hidden when absent (no line has a price). */
  totalLabel?: string;
  /** Short note next to the subtotal (e.g. that the price is before customization). */
  totalNote?: string;
  sendHref: string;
  onSetQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  labels: CartPanelLabels;
  /** Already-written messages about what changed in the cart (e.g. after syncing stock). */
  notices?: readonly string[];
  /** pending = inventory not verified yet, the send link is disabled. */
  sendState?: 'ready' | 'pending';
  /** Extra note under the send button (e.g. inventory could not be verified). */
  sendNote?: string;
  /** Button shown when the cart is empty (e.g. back to the products). */
  emptyAction?: { label: string; onClick: () => void };
  /** data-theme for the portaled panel (it renders outside the PageShell). */
  theme?: string;
};

/** Side dialog with the cart summary and the send-order link. */
export function CartPanel({
  open,
  onClose,
  items,
  totalLabel,
  totalNote,
  sendHref,
  onSetQty,
  onRemove,
  labels,
  notices = [],
  sendState = 'ready',
  sendNote,
  emptyAction,
  theme,
}: Props) {
  const titleId = useId();
  const empty = items.length === 0;
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} placement="side" theme={theme} className={styles.box} rootClassName={styles.backdrop}>
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {labels.title}
        </h2>
        <button type="button" className={styles.close} aria-label={labels.close} onClick={onClose}>
          <Icon name="close" size="md" />
        </button>
      </div>

      {notices.length > 0 && (
        <div className={styles.notices} role="status">
          <p className={styles.noticesTitle}>{labels.noticesTitle}</p>
          <ul className={styles.noticeList}>
            {notices.map((n, i) => (
              // Two notices can share the same text (two products with the same name): key by index.
              <li key={`${i}-${n}`}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {empty ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{labels.empty}</p>
          {emptyAction && (
            <Button variant="secondary" onClick={emptyAction.onClick}>
              {emptyAction.label}
            </Button>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <CartPanelRow key={item.id} item={item} labels={labels} onSetQty={onSetQty} onRemove={onRemove} />
          ))}
        </ul>
      )}

      {!empty && (
        <div className={styles.footer}>
          {totalLabel !== undefined && (
            <div className={styles.total}>
              <span>
                {labels.total}
                {totalNote && <span className={styles.totalNote}>{totalNote}</span>}
              </span>
              <span className={styles.totalValue}>{totalLabel}</span>
            </div>
          )}
          {sendState === 'pending' ? (
            <Button icon="whatsapp" size="lg" block disabled className={styles.send}>
              {labels.verifying}
            </Button>
          ) : (
            <Button href={sendHref} external icon="whatsapp" size="lg" block className={styles.send}>
              {labels.send}
            </Button>
          )}
          <p className={styles.note}>{sendNote ?? labels.note}</p>
        </div>
      )}
    </Modal>
  );
}
