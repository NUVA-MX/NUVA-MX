'use client';

import { catalogItems } from '@/lib/catalogItemCache';
import { catalogCartId, catalogLineName } from '@/lib/catalog/cart-line';
import type { CatalogCard } from '@/lib/catalog/types';
import { useCart } from '@/lib/cart/CartContext';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';

export type CatalogToggle = {
  /** Pieces of the product in the list, summed over its colors. */
  qtyOf: (code: string) => number;
  /** Adds the product in its first available color (with its customer price when visible) without opening the detail. */
  add: (card: CatalogCard) => void;
  /** Sets the pieces of a one-color product; 0 removes it. */
  setQty: (code: string, qty: number) => void;
};

/** Card-level add and quantity for catalog products on top of the existing cart (no cart logic changes). */
export function useCatalogToggle(openDetail: (code: string) => void): CatalogToggle {
  const cart = useCart();
  const lines = (code: string) => cart.items.filter((i) => i.id.startsWith(`cat:${code}:`));
  const qtyOf = (code: string) => lines(code).reduce((sum, i) => sum + i.qty, 0);

  function add(card: CatalogCard) {
    catalogItems.get(card.code)
      .then((product) => {
        const variant = product.variants.find((v) => v.availability !== 'out');
        if (!variant) return openDetail(card.code);
        cart.add({
          id: catalogCartId(product.code, variant.code),
          name: catalogLineName(copy.listItemName, { name: product.name, tone: variant.tone, code: variant.code }),
          price: product.price,
          stock: null,
        });
      })
      .catch(() => openDetail(card.code));
  }

  function setQty(code: string, qty: number) {
    const line = lines(code)[0];
    if (line) cart.setQty(line.id, qty);
  }

  return { qtyOf, add, setQty };
}
