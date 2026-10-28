import { isCatalogCartId } from '@/lib/catalog/cart-line';
import type { Product } from '@/lib/products/types';
import { maxQty, type CartItem, type CartState } from './reducer';

export type CartChange =
  | { kind: 'removed'; name: string }
  | { kind: 'soldOut'; name: string }
  | { kind: 'qty'; name: string; qty: number }
  | { kind: 'price'; name: string; price: number | null };

function sameItem(a: CartItem, b: CartItem | undefined): boolean {
  return !!b && a.id === b.id && a.name === b.name && a.price === b.price && a.stock === b.stock && a.qty === b.qty;
}

/**
 * Brings a stored cart in line with the live catalog:
 * - products that no longer exist (deleted or hidden) are removed,
 * - sold-out products are removed,
 * - quantities are capped to current stock,
 * - name, price and stock are refreshed.
 * Returns the same state object when nothing changed.
 */
export function reconcileCart(state: CartState, products: readonly Product[]): { state: CartState; changes: CartChange[] } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: CartItem[] = [];
  const changes: CartChange[] = [];

  for (const item of state.items) {
    if (isCatalogCartId(item.id)) {
      // Supplier catalog lines are not in the products table: stock is never trusted from storage. The stored price
      // (already range-checked on load) is kept only to show an estimate; the WhatsApp message never includes it.
      items.push({ ...item, stock: null });
      continue;
    }
    const p = byId.get(item.id);
    if (!p) {
      changes.push({ kind: 'removed', name: item.name });
      continue;
    }
    if (p.stock !== null && p.stock <= 0) {
      changes.push({ kind: 'soldOut', name: p.name });
      continue;
    }
    const qty = Math.min(item.qty, maxQty(p.stock));
    if (qty < item.qty) changes.push({ kind: 'qty', name: p.name, qty });
    if (p.price !== item.price) changes.push({ kind: 'price', name: p.name, price: p.price });
    items.push({ id: p.id, name: p.name, price: p.price, stock: p.stock, qty });
  }

  const unchanged = items.length === state.items.length && items.every((it, i) => sameItem(it, state.items[i]));
  return { state: unchanged ? state : { items }, changes };
}
