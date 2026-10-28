'use client';

import { Icon } from '@/components/primitives/Icon';
import { Media } from '@/components/primitives/Media';
import { MAX_QTY } from '@/lib/cart/reducer';
import type { CatalogCard as CatalogCardData } from '@/lib/catalog/types';
import { fillTemplate, formatMXN } from '@/lib/format';
import styles from './CatalogCard.module.css';

export type CatalogPrefetch = { prefetch: (code: string) => void; prefetchSoon: (code: string) => void; cancelSoon: () => void };

export type CatalogCardLabels = {
  add: string;
  /** "En mi lista · {n}" */
  inList: string;
  from: string;
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
 * Catalog card: white square photo (opens the detail), category and code pills, name, and a bottom row with the price
 * (only when the API sends one) and the action: "+ Agregar", a quantity pill, or "En mi lista · n" for several colors.
 */
export function CatalogCard({ card, labels, qty, onAdd, onSetQty, onOpen, prefetch }: Props) {
  const vars = { name: card.name, n: qty };
  const several = card.variantCount > 1;
  return (
    <article
      className={styles.root}
      onPointerEnter={(e) => e.pointerType === 'mouse' && prefetch?.prefetchSoon(card.code)}
      onPointerLeave={() => prefetch?.cancelSoon()}
      onFocus={() => prefetch?.prefetch(card.code)}
      onTouchStart={() => prefetch?.prefetch(card.code)}
    >
      <button type="button" className={styles.photo} aria-label={fillTemplate(labels.viewDetailAria, vars)} onClick={() => onOpen(card.code)}>
        <Media src={card.image} alt="" ratio="1/1" sizes="grid" />
      </button>
      <div className={styles.body}>
        <div className={styles.pills}>
          {card.category && <span className={styles.category}>{card.category}</span>}
          <span className={styles.code}>{card.code}</span>
        </div>
        <h3 className={styles.name}>{card.name}</h3>
        <div className={styles.bottom}>
          {card.price !== null && (
            <p className={styles.price}>
              <span className={styles.from}>{labels.from}</span>
              <span className={styles.amount}>{formatMXN(card.price)}</span>
            </p>
          )}
          <div className={styles.action}>
            {qty === 0 && (
              <button type="button" className={styles.add} aria-label={fillTemplate(labels.addAria, vars)} onClick={() => onAdd(card)}>
                {labels.add}
              </button>
            )}
            {qty > 0 && several && (
              <button type="button" className={styles.inList} aria-label={fillTemplate(labels.inListAria, vars)} onClick={() => onOpen(card.code)}>
                {fillTemplate(labels.inList, vars)}
              </button>
            )}
            {qty > 0 && !several && (
              <div className={styles.stepper} role="group" aria-label={fillTemplate(labels.qtyAria, vars)}>
                <button
                  type="button"
                  className={styles.step}
                  aria-label={fillTemplate(labels.decreaseAria, vars)}
                  onClick={() => onSetQty(card.code, qty - 1)}
                >
                  <Icon name="minus" />
                </button>
                <output className={styles.qty} aria-live="polite">
                  {qty}
                </output>
                <button
                  type="button"
                  className={styles.step}
                  aria-label={fillTemplate(labels.increaseAria, vars)}
                  disabled={qty >= MAX_QTY}
                  onClick={() => onSetQty(card.code, qty + 1)}
                >
                  <Icon name="plus" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
