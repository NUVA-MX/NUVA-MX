'use client';

import { Button } from '@/components/primitives/Button';
import type { CartPanelLabels } from './CartPanel';
import styles from './CartPanelFooter.module.css';

type Props = {
  totalLabel?: string;
  totalNote?: string;
  sendHref: string;
  sendState: 'ready' | 'pending';
  sendNote?: string;
  labels: Pick<CartPanelLabels, 'total' | 'send' | 'note' | 'verifying'>;
};

/** Sticky summary of "Mi lista": subtotal, the send-to-WhatsApp button and a note. */
export function CartPanelFooter({ totalLabel, totalNote, sendHref, sendState, sendNote, labels }: Props) {
  return (
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
      <p className={sendNote ? `${styles.note} ${styles.noteWarn}` : styles.note}>{sendNote ?? labels.note}</p>
    </div>
  );
}
