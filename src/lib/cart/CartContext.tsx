'use client';

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { orderTotal } from '@/lib/order';
import type { Product } from '@/lib/products/types';
import type { CartChange } from './reconcile';
import { cartCount, type CartItem } from './reducer';
import { cartStore, type CartVerification } from './store';

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  changes: CartChange[];
  verification: CartVerification;
  add: (product: Pick<Product, 'id' | 'name' | 'price' | 'stock'>) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  qtyOf: (id: string) => number;
  /** Call with the live catalog once it loads (or null if it failed). */
  syncWithCatalog: (products: readonly Product[] | null) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Cart persisted in localStorage under `nuva.cart.v1`, reconciled with the live catalog. */
export function CartProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const [isOpen, setOpen] = useState(false);

  const add = useCallback<CartContextValue['add']>(
    (p) => cartStore.dispatch({ type: 'add', item: { id: p.id, name: p.name, price: p.price, stock: p.stock } }),
    [],
  );
  const remove = useCallback((id: string) => cartStore.dispatch({ type: 'remove', id }), []);
  const setQty = useCallback((id: string, qty: number) => cartStore.dispatch({ type: 'setQty', id, qty }), []);
  const clear = useCallback(() => cartStore.dispatch({ type: 'clear' }), []);
  const syncWithCatalog = useCallback((products: readonly Product[] | null) => {
    if (products) cartStore.reconcile(products);
    else cartStore.markUnavailable();
  }, []);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => {
    setOpen(false);
    // Notices were shown in the panel; do not repeat them next time.
    cartStore.clearChanges();
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: snap.cart.items,
      count: cartCount(snap.cart),
      total: orderTotal(snap.cart.items),
      changes: snap.changes,
      verification: snap.verification,
      add,
      remove,
      setQty,
      clear,
      qtyOf: (id) => snap.cart.items.find((i) => i.id === id)?.qty ?? 0,
      syncWithCatalog,
      isOpen,
      openCart,
      closeCart,
    }),
    [snap, add, remove, setQty, clear, syncWithCatalog, isOpen, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
