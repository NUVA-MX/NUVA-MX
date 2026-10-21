export type CartItem = {
  id: string;
  name: string;
  price: number | null;
  stock: number | null;
  qty: number;
};

export type CartState = { items: CartItem[] };

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'remove'; id: string }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'clear' }
  | { type: 'hydrate'; state: CartState };

/** Max pieces of one product in the cart when stock is unknown (and hard ceiling otherwise). */
export const MAX_QTY = 99;
/** Upper bound for a stored price (MXN); anything above is treated as corrupt. */
export const MAX_PRICE = 1_000_000;
const MAX_ITEMS = 100;

export const initialCart: CartState = { items: [] };

/** Largest quantity allowed for a product with this stock. */
export function maxQty(stock: number | null): number {
  return stock === null ? MAX_QTY : Math.min(stock, MAX_QTY);
}

/** True when no more pieces can be added: at the stock, or at MAX_QTY when stock is unknown. */
export function isAtMaxQty(quantityInCart: number, stock: number | null): boolean {
  return quantityInCart >= maxQty(stock);
}

function cap(qty: number, stock: number | null): number {
  if (!Number.isFinite(qty)) return 0;
  return Math.min(Math.floor(qty), maxQty(stock));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const { item } = action;
      const step = action.qty ?? 1;
      if (item.stock !== null && item.stock <= 0) return state;
      const existing = state.items.find((i) => i.id === item.id);
      if (!existing) {
        const qty = cap(step, item.stock);
        if (qty <= 0) return state;
        return { items: [...state.items, { ...item, qty }] };
      }
      const qty = cap(existing.qty + step, item.stock);
      if (qty === existing.qty) return state;
      return {
        items: state.items.map((i) => (i.id === item.id ? { ...i, ...item, qty } : i)),
      };
    }
    case 'remove':
      return { items: state.items.filter((i) => i.id !== action.id) };
    case 'setQty': {
      const target = state.items.find((i) => i.id === action.id);
      if (!target) return state;
      const qty = cap(action.qty, target.stock);
      if (qty <= 0) return { items: state.items.filter((i) => i.id !== action.id) };
      if (qty === target.qty) return state;
      return { items: state.items.map((i) => (i.id === action.id ? { ...i, qty } : i)) };
    }
    case 'clear':
      return initialCart;
    case 'hydrate':
      return sanitizeCart(action.state);
    default:
      return state;
  }
}

const isWholeNonNeg = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;

/**
 * Validates whatever comes from localStorage: drops items without a valid shape,
 * negative/huge prices or bad stock, and caps quantities to stock and MAX_QTY.
 * Duplicate ids are merged: the first entry's data is kept and the quantities are summed,
 * then capped again (so a tampered cart can't hold more than the stock in two lines).
 */
export function sanitizeCart(raw: unknown): CartState {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as CartState).items)) return initialCart;
  const items: CartItem[] = [];
  const byId = new Map<string, CartItem>();
  for (const i of (raw as { items: unknown[] }).items.slice(0, MAX_ITEMS)) {
    if (!i || typeof i !== 'object') continue;
    const it = i as Record<string, unknown>;
    if (typeof it.id !== 'string' || it.id.length === 0 || it.id.length > 100) continue;
    if (typeof it.name !== 'string' || it.name.length === 0 || it.name.length > 200) continue;
    if (!(it.price === null || (isWholeNonNeg(it.price) && it.price <= MAX_PRICE))) continue;
    if (!(it.stock === null || isWholeNonNeg(it.stock))) continue;
    if (typeof it.qty !== 'number') continue;
    const stock = it.stock as number | null;
    const qty = cap(it.qty, stock);
    if (qty <= 0) continue;
    const first = byId.get(it.id);
    if (first) {
      first.qty = cap(first.qty + qty, first.stock);
      continue;
    }
    const item: CartItem = { id: it.id, name: it.name, price: it.price as number | null, stock, qty };
    byId.set(item.id, item);
    items.push(item);
  }
  return { items };
}

export function cartCount(state: CartState): number {
  return state.items.reduce((n, i) => n + i.qty, 0);
}
