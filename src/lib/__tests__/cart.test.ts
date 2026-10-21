import { describe, expect, it } from 'vitest';
import { MAX_QTY, cartCount, cartReducer, initialCart, isAtMaxQty, sanitizeCart } from '../cart/reducer';

const gorra = { id: 'g', name: 'Gorra', price: 390, stock: 3 };
const sinStock = { id: 's', name: 'Gorro', price: 320, stock: 0 };
const libre = { id: 'l', name: 'Tote', price: 280, stock: null };

describe('cartReducer', () => {
  it('añade y suma cantidad', () => {
    let s = cartReducer(initialCart, { type: 'add', item: gorra });
    s = cartReducer(s, { type: 'add', item: gorra });
    expect(s.items).toEqual([{ ...gorra, qty: 2 }]);
    expect(cartCount(s)).toBe(2);
  });
  it('no pasa del stock', () => {
    let s = initialCart;
    for (let i = 0; i < 5; i++) s = cartReducer(s, { type: 'add', item: gorra });
    expect(s.items[0].qty).toBe(3);
  });
  it('no añade productos agotados', () => {
    expect(cartReducer(initialCart, { type: 'add', item: sinStock })).toBe(initialCart);
  });
  it('sin stock conocido no limita', () => {
    const s = cartReducer(initialCart, { type: 'add', item: libre, qty: 50 });
    expect(s.items[0].qty).toBe(50);
  });
  it('setQty limita al stock y quita con 0', () => {
    let s = cartReducer(initialCart, { type: 'add', item: gorra });
    s = cartReducer(s, { type: 'setQty', id: 'g', qty: 10 });
    expect(s.items[0].qty).toBe(3);
    s = cartReducer(s, { type: 'setQty', id: 'g', qty: 0 });
    expect(s.items).toEqual([]);
  });
  it('remove y clear', () => {
    let s = cartReducer(initialCart, { type: 'add', item: gorra });
    s = cartReducer(s, { type: 'add', item: libre });
    s = cartReducer(s, { type: 'remove', id: 'g' });
    expect(s.items.map((i) => i.id)).toEqual(['l']);
    expect(cartReducer(s, { type: 'clear' })).toEqual(initialCart);
  });
  it('hydrate descarta datos corruptos', () => {
    const s = cartReducer(initialCart, {
      type: 'hydrate',
      state: { items: [{ ...gorra, qty: 9 }, { id: 1, qty: 'x' } as never] },
    });
    expect(s.items).toEqual([{ ...gorra, qty: 3 }]);
    expect(sanitizeCart('basura')).toEqual(initialCart);
  });
});

describe('isAtMaxQty (ProductCard "Añadir" disabled state)', () => {
  it('caps at 99 when stock is unknown', () => {
    expect(isAtMaxQty(MAX_QTY - 1, null)).toBe(false);
    expect(isAtMaxQty(MAX_QTY, null)).toBe(true);
  });

  it('caps at the stock, and never above 99', () => {
    expect(isAtMaxQty(2, 3)).toBe(false);
    expect(isAtMaxQty(3, 3)).toBe(true);
    expect(isAtMaxQty(MAX_QTY, 500)).toBe(true);
    expect(isAtMaxQty(0, 0)).toBe(true);
  });
});

describe('sanitizeCart duplicate ids', () => {
  const t = { id: 't', name: 'Trucker azul', price: 420, stock: 3, qty: 3 };

  it('merges duplicates into one line capped by stock (tester repro)', () => {
    expect(sanitizeCart({ items: [t, { ...t }] }).items).toEqual([t]);
  });

  it('keeps the first entry data and sums quantities', () => {
    const a = { id: 'g', name: 'Gorra', price: 390, stock: 10, qty: 2 };
    const b = { id: 'g', name: 'Otro nombre', price: 1, stock: 99, qty: 5 };
    expect(sanitizeCart({ items: [a, b] }).items).toEqual([{ ...a, qty: 7 }]);
  });

  it('caps merged quantities at 99 when stock is unknown', () => {
    const a = { id: 'n', name: 'Sin stock', price: null, stock: null, qty: 60 };
    expect(sanitizeCart({ items: [a, { ...a }] }).items).toEqual([{ ...a, qty: MAX_QTY }]);
  });

  it('drops an invalid duplicate without touching the valid one', () => {
    const a = { id: 'g', name: 'Gorra', price: 390, stock: 10, qty: 2 };
    expect(sanitizeCart({ items: [a, { ...a, price: -5, qty: 4 }] }).items).toEqual([a]);
  });
});
