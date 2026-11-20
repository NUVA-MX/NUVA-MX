'use client';

import { Button } from '@/components/primitives/Button';
import type { CartPanelLabels } from './CartPanel';
import styles from './CartPanelFooter.module.css';

type Props = {
  totalLabel?: string;
  totalNote?: string;
  sendHref: string;
  onBuy?: () => void;
  hasUnpriced?: boolean;
  sendState: 'ready' | 'pending';
  sendNote?: string;
  labels: Pick<CartPanelLabels, 'total' | 'send' | 'note' | 'verifying' | 'buy' | 'unpricedNote'>;
};

/** Sticky summary of "Mi lista": subtotal, the send-to-WhatsApp button and a note. */
export function CartPanelFooter({ totalLabel, totalNote, sendHref, onBuy, hasUnpriced, sendState, sendNote, labels }: Props) {
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
      {totalLabel !== undefined && hasUnpriced && labels.unpricedNote && <p className={styles.unpriced}>{labels.unpricedNote}</p>}
      {onBuy && labels.buy && (
        <Button size="lg" block disabled={sendState === 'pending'} onClick={onBuy} className={styles.send}>
          {labels.buy}
        </Button>
      )}
      {sendState === 'pending' ? (
        <Button variant="secondary" icon="whatsapp" size="lg" block disabled className={styles.quote}>
          {labels.verifying}
        </Button>
      ) : (
        <Button variant="secondary" href={sendHref} external icon="whatsapp" size="lg" block className={styles.quote}>
          {labels.send}
        </Button>
      )}
      <p className={sendNote ? `${styles.note} ${styles.noteWarn}` : styles.note}>{sendNote ?? labels.note}</p>
    </div>
  );
}
