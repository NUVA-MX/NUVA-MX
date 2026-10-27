'use client';

import { fetchCatalogItem } from '@/lib/api/catalog';
import { catalogCartId, catalogLineName } from '@/lib/catalog/cart-line';
import type { CatalogCard } from '@/lib/catalog/types';
import { useCart } from '@/lib/cart/CartContext';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';

export type CatalogToggle = {
  /** True while any variant of the product is in the list. */
  inList: (code: string) => boolean;
  /** Removes the product if listed; adds a one-color product; opens the detail when a color must be picked. */
  toggle: (card: CatalogCard) => void;
};

/** Card-level add/remove for catalog products on top of the existing cart (no cart logic changes). */
export function useCatalogToggle(openDetail: (code: string) => void): CatalogToggle {
  const cart = useCart();
  const prefix = (code: string) => `cat:${code}:`;
  const inList = (code: string) => cart.items.some((i) => i.id.startsWith(prefix(code)));

  function toggle(card: CatalogCard) {
    if (inList(card.code)) {
      cart.items.filter((i) => i.id.startsWith(prefix(card.code))).forEach((i) => cart.remove(i.id));
      return;
    }
    if (card.variantCount > 1) {
      openDetail(card.code);
      return;
    }
    fetchCatalogItem(card.code)
      .then((product) => {
        const variant = product.variants.find((v) => v.availability !== 'out');
        if (!variant) return openDetail(card.code);
        cart.add({
          id: catalogCartId(product.code, variant.code),
          name: catalogLineName(copy.listItemName, { name: product.name, tone: variant.tone, code: variant.code }),
          price: null,
          stock: null,
        });
      })
      .catch(() => openDetail(card.code));
  }

  return { inList, toggle };
}
