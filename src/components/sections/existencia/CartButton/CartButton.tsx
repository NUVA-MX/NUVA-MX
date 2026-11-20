'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { existencia } from '@/content/existencia';
import { useCart } from '@/lib/cart/CartContext';
import { fillTemplate } from '@/lib/format';
import styles from './CartButton.module.css';

/** Nav action: "Mi lista" with a count badge (dark when empty, blue with items) that pulses when pieces are added. */
export function CartButton() {
  const { count, openCart, isOpen } = useCart();
  // Adjusting state while rendering: each increase of the count restarts the badge animation (the badge is re-keyed).
  const [previous, setPrevious] = useState(count);
  const [bumps, setBumps] = useState(0);
  if (count !== previous) {
    setPrevious(count);
    if (count > previous) setBumps(bumps + 1);
  }
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={openCart}
      ariaHaspopup="dialog"
      ariaExpanded={isOpen}
      ariaLabel={fillTemplate(existencia.nav.cartAria, { count })}
    >
      <span className={styles.label}>{existencia.nav.cartLabel}</span>
      <span key={bumps} className={styles.badge} data-filled={count > 0} data-bump={bumps > 0} aria-hidden="true">
        {count}
      </span>
    </Button>
  );
}
