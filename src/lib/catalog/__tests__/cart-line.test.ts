import { describe, expect, it } from 'vitest';
import { reconcileCart } from '@/lib/cart/reconcile';
import { cartReducer, initialCart } from '@/lib/cart/reducer';
import { existencia } from '@/content/existencia';
import { formatMXN } from '@/lib/format';
import { buildOrderMessage } from '@/lib/order';
import { catalogCartId, catalogLineName, isCatalogCartId } from '../cart-line';

const TEMPLATE = '{name} · {tone} ({code})';

describe('catalog cart lines', () => {
  it('builds the id, name and rejects look-alike ids', () => {
    expect(catalogCartId('TH-239', 'TH-239A')).toBe('cat:TH-239:TH-239A');
    expect(isCatalogCartId('cat:TH-239:TH-239A')).toBe(true);
    for (const id of ['cat:th-239:TH-239A', 'cat:TH-239', 'cat:TH-239:TH-239A:x', '11111111-1111-4111-8111-111111111111', 'cat:../x:y']) {
      expect(isCatalogCartId(id)).toBe(false);
    }
    expect(catalogLineName(TEMPLATE, { name: 'Audífonos Pavona', tone: 'AZUL CLARO', code: 'TH-239A' })).toBe(
      'Audífonos Pavona · AZUL CLARO (TH-239A)',
    );
    expect(catalogLineName(TEMPLATE, { name: 'x'.repeat(500), tone: 't', code: 'c' }).length).toBe(200);
  });

  it('adds a null-price line and reconcile keeps it untouched', () => {
    const item = { id: catalogCartId('TH-239', 'TH-239A'), name: 'Audífonos', price: null, stock: null };
    const state = cartReducer(initialCart, { type: 'add', item, qty: 3 });
    expect(state.items).toEqual([{ ...item, qty: 3 }]);
    const r = reconcileCart(state, []);
    expect(r.state).toBe(state);
    expect(r.changes).toEqual([]);
  });

  it('does not trust stock stored in a catalog line; its price is only a display estimate', () => {
    const state = { items: [{ id: 'cat:TH-239:TH-239A', name: 'x', price: 1, stock: 1, qty: 1 }] };
    expect(reconcileCart(state, []).state.items[0]).toMatchObject({ price: 1, stock: null });
  });

  it('still removes unknown DB products', () => {
    const state = { items: [{ id: 'gone', name: 'x', price: 1, stock: 1, qty: 1 }] };
    expect(reconcileCart(state, []).state.items).toEqual([]);
  });

  it('the WhatsApp line has name, tone, variant code, quantity and "precio por confirmar"', () => {
    const name = catalogLineName('{name} · {tone} ({code})', { name: 'Audífonos Pavona', tone: 'AZUL CLARO', code: 'TH-239A' });
    const message = buildOrderMessage([{ id: catalogCartId('TH-239', 'TH-239A'), name, price: null, qty: 3 }], existencia.orderTemplate, formatMXN);
    expect(message).toContain('3 × Audífonos Pavona · AZUL CLARO (TH-239A) — precio por confirmar');
  });
});
