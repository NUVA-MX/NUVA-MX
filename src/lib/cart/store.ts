import type { Product } from '@/lib/products/types';
import { reconcileCart, type CartChange } from './reconcile';
import { cartReducer, initialCart, sanitizeCart, type CartAction, type CartState } from './reducer';

export const CART_STORAGE_KEY = 'nuva.cart.v1';

/**
 * - pending: the live catalog has not loaded yet, so the cart may be stale.
 * - ok: the cart was reconciled with the live catalog.
 * - unavailable: the catalog failed to load; the cart is kept as is.
 */
export type CartVerification = 'pending' | 'ok' | 'unavailable';

export type CartSnapshot = {
  cart: CartState;
  /** What reconciliation changed, shown to the customer in the cart panel. */
  changes: CartChange[];
  verification: CartVerification;
};

const SERVER_SNAPSHOT: CartSnapshot = { cart: initialCart, changes: [], verification: 'pending' };

let snapshot: CartSnapshot | null = null;
const listeners = new Set<() => void>();

function load(): CartState {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? sanitizeCart(JSON.parse(raw)) : initialCart;
  } catch {
    return initialCart;
  }
}

function save(next: CartState) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): the cart still works for this visit.
  }
}

function current(): CartSnapshot {
  if (snapshot === null) snapshot = { cart: load(), changes: [], verification: 'pending' };
  return snapshot;
}

function set(next: Partial<CartSnapshot>) {
  const prev = current();
  snapshot = { ...prev, ...next };
  if (next.cart && next.cart !== prev.cart) save(next.cart);
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  if (e.key !== CART_STORAGE_KEY) return;
  set({ cart: load() });
}

/** External store over localStorage, read with useSyncExternalStore. */
export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener('storage', onStorage);
    };
  },
  getSnapshot(): CartSnapshot {
    return current();
  },
  /** Server render and hydration use an empty cart; the stored cart appears right after. */
  getServerSnapshot(): CartSnapshot {
    return SERVER_SNAPSHOT;
  },
  dispatch(action: CartAction) {
    const prev = current().cart;
    const next = cartReducer(prev, action);
    if (next !== prev) set({ cart: next });
  },
  /** Applies the live catalog to the stored cart and records what changed. */
  reconcile(products: readonly Product[]) {
    const { state, changes } = reconcileCart(current().cart, products);
    set({ cart: state, changes, verification: 'ok' });
  },
  /** The catalog could not be loaded: keep the cart untouched. */
  markUnavailable() {
    if (current().verification !== 'ok') set({ verification: 'unavailable' });
  },
  clearChanges() {
    if (current().changes.length > 0) set({ changes: [] });
  },
};
