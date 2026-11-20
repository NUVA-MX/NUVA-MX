'use client';

import { Media } from '@/components/primitives/Media';
import type { CatalogCard as CatalogCardData } from '@/lib/catalog/types';
import { fillTemplate, formatMXN } from '@/lib/format';
import { CardAction } from './CardAction';
import styles from './CatalogCard.module.css';

export type CatalogPrefetch = { prefetch: (code: string) => void; prefetchSoon: (code: string) => void; cancelSoon: () => void };

export type CatalogCardLabels = {
  add: string;
  /** "En mi lista · {n}" */
  inList: string;
  /** Next to the piece count in the stepper. */
  inListCount: string;
  perPiece: string;
  /** Shown instead of a price while the API sends none. */
  quote: string;
  /** Tag next to a published price: it is the price before personalizing. */
  priceTag: string;
  addAria: string;
  /** "{name}: {n} en mi lista, ver detalle" */
  inListAria: string;
  qtyAria: string;
  decreaseAria: string;
  increaseAria: string;
  viewDetailAria: string;
};

type Props = {
  card: CatalogCardData;
  labels: CatalogCardLabels;
  /** Pieces of this product in the list (all colors). */
  qty: number;
  onAdd: (card: CatalogCardData) => void;
  onSetQty: (code: string, qty: number) => void;
  onOpen: (code: string) => void;
  /** Warms the detail cache: right away on focus/touch, after a short pause on mouse hover. */
  prefetch?: CatalogPrefetch;
};

/**
 * Catalog card: square photo tile, category and monospace code, name, the price per piece (or the quote line while the API
 * sends none) and one action. Clicking the card opens the detail; the photo is also a real button for keyboard and screen readers.
 * Colors, stock and badges live in the detail, not here.
 */
export function CatalogCard({ card, labels, qty, onAdd, onSetQty, onOpen, prefetch }: Props) {
  return (
    <article
      className={styles.root}
      onClick={() => onOpen(card.code)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && prefetch?.prefetchSoon(card.code)}
      onPointerLeave={() => prefetch?.cancelSoon()}
      onFocus={() => prefetch?.prefetch(card.code)}
      onTouchStart={() => prefetch?.prefetch(card.code)}
    >
      <button type="button" className={styles.photo} aria-label={fillTemplate(labels.viewDetailAria, { name: card.name })}>
        <Media src={card.image} alt="" ratio="1/1" sizes="grid" />
      </button>
      <div className={styles.body}>
        <div className={styles.pills}>
          {card.category && <span className={styles.category}>{card.category}</span>}
          <span className={styles.code}>{card.code}</span>
        </div>
        <h3 className={styles.name}>{card.name}</h3>
        <div className={styles.bottom}>
          {card.price !== null ? (
            <p className={styles.price}>
              <span className={styles.amount}>{formatMXN(card.price)}</span>
              <span className={styles.unit}>{labels.perPiece}</span>
              <span className={styles.tag}>{labels.priceTag}</span>
            </p>
          ) : (
            <p className={styles.quote}>{labels.quote}</p>
          )}
          <CardAction
            code={card.code}
            name={card.name}
            qty={qty}
            several={card.variantCount > 1}
            labels={labels}
            onAdd={() => onAdd(card)}
            onSetQty={onSetQty}
            onOpen={onOpen}
          />
        </div>
      </div>
    </article>
  );
}
