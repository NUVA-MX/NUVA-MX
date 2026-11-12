'use client';

import Image from 'next/image';
import { useId } from 'react';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/primitives/Icon';
import { Modal } from '../Modal';
import { CartPanelFooter } from './CartPanelFooter';
import { CartPanelRow } from './CartPanelRow';
import styles from './CartPanel.module.css';
import bodyStyles from './CartPanelBody.module.css';

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
        <div className={styles.headerTop}>
          <Image className={styles.logo} src="/brand/logo-nuva-gris.png" alt="NUVA" width={800} height={244} sizes="112px" />
          <button type="button" className={styles.close} aria-label={labels.close} onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>
        <div className={styles.headerTitle}>
          <h2 id={titleId} className={styles.title}>
            {labels.title}
          </h2>
          {!empty && (
            <span className={styles.count} aria-hidden="true">
              {items.length}
            </span>
          )}
        </div>
      </div>

      <div className={bodyStyles.body}>
        {notices.length > 0 && (
          <div className={bodyStyles.notices} role="status">
            <p className={bodyStyles.noticesTitle}>{labels.noticesTitle}</p>
            <ul className={bodyStyles.noticeList}>
              {notices.map((n, i) => (
                // Two notices can share the same text (two products with the same name): key by index.
                <li key={`${i}-${n}`}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        {empty ? (
          <div className={bodyStyles.empty}>
            <div className={bodyStyles.emptyArt}>
              <Image src="/brand/sello-nuva.png" alt="" width={507} height={520} sizes="96px" />
            </div>
            <p className={bodyStyles.emptyText}>{labels.empty}</p>
            {emptyAction && (
              <Button variant="primary" onClick={emptyAction.onClick}>
                {emptyAction.label}
              </Button>
            )}
          </div>
        ) : (
          <ul className={bodyStyles.list}>
            {items.map((item) => (
              <CartPanelRow key={item.id} item={item} labels={labels} onSetQty={onSetQty} onRemove={onRemove} />
            ))}
          </ul>
        )}
      </div>

      {!empty && <CartPanelFooter totalLabel={totalLabel} totalNote={totalNote} sendHref={sendHref} sendState={sendState} sendNote={sendNote} labels={labels} />}
    </Modal>
  );
}
