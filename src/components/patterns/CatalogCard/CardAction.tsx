'use client';

import { HoldStepButton, Quantity } from '@/components/patterns/HoldStepButton';
import { Icon } from '@/components/primitives/Icon';
import { MAX_QTY } from '@/lib/cart/reducer';
import { fillTemplate } from '@/lib/format';
import type { CatalogCardLabels } from './CatalogCard';
import styles from './CardAction.module.css';

type Props = {
  code: string;
  name: string;
  qty: number;
  /** Several colors: the quantity is chosen in the detail, so the card only shows the total. */
  several: boolean;
  labels: CatalogCardLabels;
  onAdd: () => void;
  onSetQty: (code: string, qty: number) => void;
  onOpen: (code: string) => void;
};

/** Card button: "+ Agregar a mi lista" (outline), "En mi lista · n" (several colors) or the stepper "− n en tu lista +". */
export function CardAction({ code, name, qty, several, labels, onAdd, onSetQty, onOpen }: Props) {
  const vars = { name, n: qty };
  // The card itself opens the detail on click; the action buttons must not.
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  if (qty === 0) {
    return (
      <button type="button" className={styles.add} aria-label={fillTemplate(labels.addAria, vars)} onClick={(e) => (stop(e), onAdd())}>
        {labels.add}
      </button>
    );
  }
  if (several) {
    return (
      <button type="button" className={styles.inList} aria-label={fillTemplate(labels.inListAria, vars)} onClick={(e) => (stop(e), onOpen(code))}>
        {fillTemplate(labels.inList, vars)}
      </button>
    );
  }
  return (
    <div className={styles.stepper} role="group" aria-label={fillTemplate(labels.qtyAria, vars)} onClick={stop}>
      <HoldStepButton
        value={qty}
        direction={-1}
        max={MAX_QTY}
        onChange={(n) => onSetQty(code, n)}
        className={styles.step}
        ariaLabel={fillTemplate(labels.decreaseAria, vars)}
      >
        <Icon name="minus" />
      </HoldStepButton>
      <span className={styles.count}>
        <Quantity value={qty} className={styles.qty} />
        <span aria-hidden="true" className={styles.label}>
          {labels.inListCount}
        </span>
      </span>
      <HoldStepButton
        value={qty}
        direction={1}
        max={MAX_QTY}
        disabled={qty >= MAX_QTY}
        onChange={(n) => onSetQty(code, n)}
        className={styles.step}
        ariaLabel={fillTemplate(labels.increaseAria, vars)}
      >
        <Icon name="plus" />
      </HoldStepButton>
    </div>
  );
}
