'use client';

import { CartPanel } from '@/components/patterns/CartPanel';
import { existencia } from '@/content/existencia';
import { site } from '@/content/site';
import { ui } from '@/content/ui';
import { useCart } from '@/lib/cart/CartContext';
import type { CartChange } from '@/lib/cart/reconcile';
import { fillTemplate, formatMXN } from '@/lib/format';
import { buildOrderMessage } from '@/lib/order';
import { buildWhatsAppLink } from '@/lib/whatsapp';

function describe(change: CartChange): string {
  const t = existencia.cart.changes;
  switch (change.kind) {
    case 'removed':
      return fillTemplate(t.removed, { name: change.name });
    case 'soldOut':
      return fillTemplate(t.soldOut, { name: change.name });
    case 'qty':
      return fillTemplate(t.qty, { name: change.name, qty: change.qty });
    case 'price':
      return change.price === null
        ? fillTemplate(t.priceUnknown, { name: change.name })
        : fillTemplate(t.price, { name: change.name, price: formatMXN(change.price) });
  }
}

/** Closes the panel, then scrolls to and focuses the products section (after the modal restores focus). */
function goToProducts(close: () => void): void {
  close();
  requestAnimationFrame(() => {
    const section = document.getElementById('productos');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section?.focus({ preventScroll: true });
  });
}

/**
 * Cart summary panel wired to the cart context and the WhatsApp order template.
 * The order message is built from the reconciled cart; sending waits until the live catalog loads.
 */
export function Cart() {
  const cart = useCart();
  const c = existencia.cart;
  const message = buildOrderMessage(cart.items, existencia.orderTemplate, formatMXN);
  return (
    <CartPanel
      theme="taller"
      open={cart.isOpen}
      onClose={cart.closeCart}
      items={cart.items.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        priceLabel: i.price === null ? c.noPrice : formatMXN(i.price * i.qty),
        max: i.stock,
      }))}
      totalLabel={formatMXN(cart.total)}
      sendHref={buildWhatsAppLink({ phone: site.whatsapp.phone, message })}
      onSetQty={cart.setQty}
      onRemove={cart.remove}
      notices={cart.changes.map(describe)}
      sendState={cart.verification === 'pending' ? 'pending' : 'ready'}
      sendNote={cart.verification === 'unavailable' ? c.unverified : undefined}
      emptyAction={{ label: c.emptyCta, onClick: () => goToProducts(cart.closeCart) }}
      labels={{
        title: c.title,
        empty: c.empty,
        total: c.total,
        send: c.send,
        note: c.note,
        close: ui.close,
        remove: c.remove,
        removeAria: c.removeAria,
        qty: c.qty,
        increase: c.increase,
        decrease: c.decrease,
        noticesTitle: c.changesTitle,
        verifying: c.verifying,
      }}
    />
  );
}
