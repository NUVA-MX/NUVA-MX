import { describe, expect, it } from 'vitest';
import { reconcileCart } from '../cart/reconcile';
import { sanitizeCart } from '../cart/reducer';
import type { Product } from '../products/types';

const product = (p: Partial<Product> & { id: string }): Product => ({
  name: p.id,
  meta: null,
  price: 100,
  stock: 10,
  image: null,
  imageAlt: null,
  category: null,
  ...p,
});

describe('reconcileCart', () => {
  it('caps quantity to current stock and refreshes the price (tester repro)', () => {
    const state = { items: [{ id: 't', name: 'Trucker azul', price: 420, stock: 3, qty: 3 }] };
    const { state: next, changes } = reconcileCart(state, [product({ id: 't', name: 'Trucker azul', price: 999, stock: 1 })]);
    expect(next.items).toEqual([{ id: 't', name: 'Trucker azul', price: 999, stock: 1, qty: 1 }]);
    expect(changes).toEqual([
      { kind: 'qty', name: 'Trucker azul', qty: 1 },
      { kind: 'price', name: 'Trucker azul', price: 999 },
    ]);
  });

  it('removes products that no longer exist (deleted or hidden)', () => {
    const state = { items: [{ id: 'gone', name: 'Producto borrado', price: 100, stock: 3, qty: 2 }] };
    const r = reconcileCart(state, [product({ id: 'other' })]);
    expect(r.state.items).toEqual([]);
    expect(r.changes).toEqual([{ kind: 'removed', name: 'Producto borrado' }]);
  });

  it('removes sold-out products', () => {
    const state = { items: [{ id: 'g', name: 'Gorro', price: 320, stock: 2, qty: 1 }] };
    const r = reconcileCart(state, [product({ id: 'g', name: 'Gorro', price: 320, stock: 0 })]);
    expect(r.state.items).toEqual([]);
    expect(r.changes).toEqual([{ kind: 'soldOut', name: 'Gorro' }]);
  });

  it('an empty catalog empties the cart', () => {
    const state = { items: [{ id: 'a', name: 'A', price: 1, stock: 1, qty: 1 }] };
    expect(reconcileCart(state, []).state.items).toEqual([]);
  });

  it('updates names silently and keeps the same object when nothing changed', () => {
    const state = { items: [{ id: 'a', name: 'A', price: 100, stock: 10, qty: 2 }] };
    expect(reconcileCart(state, [product({ id: 'a', name: 'A' })]).state).toBe(state);
    const renamed = reconcileCart(state, [product({ id: 'a', name: 'A nueva' })]);
    expect(renamed.state.items[0].name).toBe('A nueva');
    expect(renamed.changes).toEqual([]);
  });

  it('reports a price that became unknown', () => {
    const state = { items: [{ id: 'a', name: 'A', price: 100, stock: null, qty: 2 }] };
    const r = reconcileCart(state, [product({ id: 'a', name: 'A', price: null, stock: null })]);
    expect(r.changes).toEqual([{ kind: 'price', name: 'A', price: null }]);
    expect(r.state.items[0].qty).toBe(2);
  });

  it('caps unknown-stock items to the maximum quantity', () => {
    const state = { items: [{ id: 'a', name: 'A', price: 1, stock: null, qty: 500 }] };
    const r = reconcileCart(state, [product({ id: 'a', name: 'A', price: 1, stock: null })]);
    expect(r.state.items[0].qty).toBe(99);
  });
});

describe('reconcileCart after sanitizeCart with duplicate ids', () => {
  it('a tampered cart with the same id twice cannot exceed stock', () => {
    const t = { id: 't', name: 'Trucker azul', price: 420, stock: 3, qty: 3 };
    const stored = sanitizeCart({ items: [t, { ...t }] });
    const { state } = reconcileCart(stored, [product({ id: 't', name: 'Trucker azul', price: 420, stock: 3 })]);
    expect(state.items).toHaveLength(1);
    expect(state.items.reduce((n, i) => n + i.qty, 0)).toBeLessThanOrEqual(3);
  });

  it('keeps the estimate price of supplier catalog lines but never their stock', () => {
    const state = { items: [{ id: 'cat:AB-1:AB-1-R', name: 'Taza', price: 120, stock: 5, qty: 2 }] };
    const { state: next, changes } = reconcileCart(state, []);
    expect(next.items).toEqual([{ id: 'cat:AB-1:AB-1-R', name: 'Taza', price: 120, stock: null, qty: 2 }]);
    expect(changes).toEqual([]);
  });
});
