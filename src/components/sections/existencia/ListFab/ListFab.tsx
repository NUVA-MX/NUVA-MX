'use client';

import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { useCart } from '@/lib/cart/CartContext';
import styles from './ListFab.module.css';

/** Floating pill that opens "Mi lista" (where the WhatsApp order is sent). Rendered only when the list has items. */
export function ListFab() {
  const { count, openCart, isOpen } = useCart();
  if (count < 1) return null;
  return (
    <button type="button" className={styles.root} onClick={openCart} aria-haspopup="dialog" aria-expanded={isOpen}>
      <span>{copy.fab.label}</span>
      <span className={styles.counter} aria-hidden="true">
        {count}
      </span>
    </button>
  );
}
