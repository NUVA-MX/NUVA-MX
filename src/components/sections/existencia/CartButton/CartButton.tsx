'use client';

import { Button } from '@/components/primitives/Button';
import { existencia } from '@/content/existencia';
import { useCart } from '@/lib/cart/CartContext';
import { fillTemplate } from '@/lib/format';

/** Nav action: shows the cart count and opens the cart panel. */
export function CartButton() {
  const { count, openCart, isOpen } = useCart();
  return (
    <Button variant="secondary" size="sm" onClick={openCart} ariaHaspopup="dialog" ariaExpanded={isOpen}>
      {fillTemplate(existencia.nav.cart, { count })}
    </Button>
  );
}
