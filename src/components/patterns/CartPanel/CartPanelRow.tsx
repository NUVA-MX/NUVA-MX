'use client';

import { HoldStepButton, Quantity } from '@/components/patterns/HoldStepButton';
import { Icon } from '@/components/primitives/Icon';
import { MAX_QTY } from '@/lib/cart/reducer';
import { fillTemplate } from '@/lib/format';
import type { CartPanelItem, CartPanelLabels } from './CartPanel';
import styles from './CartPanel.module.css';

type Props = {
  item: CartPanelItem;
  labels: CartPanelLabels;
  onSetQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
};

/** One line of "Mi lista": name, price text, a quantity pill whose buttons also work held down, and "Quitar". */
export function CartPanelRow({ item, labels, onSetQty, onRemove }: Props) {
  const vars = { name: item.name };
  const max = item.max === null ? MAX_QTY : Math.min(item.max, MAX_QTY);
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <p className={styles.name}>{item.name}</p>
        <p className={styles.price}>{item.priceLabel}</p>
      </div>
      <div className={styles.controls}>
        <div className={styles.qty} role="group" aria-label={`${labels.qty}: ${item.name}`}>
          <HoldStepButton
            value={item.qty}
            direction={-1}
            max={max}
            onChange={(n) => onSetQty(item.id, n)}
            className={styles.qtyButton}
            ariaLabel={fillTemplate(labels.decrease, vars)}
          >
            <Icon name="minus" />
          </HoldStepButton>
          <Quantity value={item.qty} className={styles.qtyValue} />
          <HoldStepButton
            value={item.qty}
            direction={1}
            max={max}
            disabled={item.qty >= max}
            onChange={(n) => onSetQty(item.id, n)}
            className={styles.qtyButton}
            ariaLabel={fillTemplate(labels.increase, vars)}
          >
            <Icon name="plus" />
          </HoldStepButton>
        </div>
        <button type="button" className={styles.remove} aria-label={fillTemplate(labels.removeAria, vars)} onClick={() => onRemove(item.id)}>
          {labels.remove}
        </button>
      </div>
    </li>
  );
}
