import { describe, expect, it } from 'vitest';
import { buildOrderMessage, orderTotal } from '../order';
import { formatMXN } from '../format';

const template = {
  header: 'Hola Nuva, quiero hacer este pedido:',
  line: '{qty} × {name} — {price}',
  footer: 'Total estimado: {total}',
  noPrice: 'precio por confirmar',
};

describe('buildOrderMessage', () => {
  it('arma encabezado, líneas y total', () => {
    const msg = buildOrderMessage(
      [
        { id: 'a', name: 'Gorra clásica negra', price: 390, qty: 2 },
        { id: 'b', name: 'Sudadera marino', price: 890, qty: 1 },
      ],
      template,
      formatMXN,
    );
    expect(msg).toBe(
      [
        'Hola Nuva, quiero hacer este pedido:',
        '2 × Gorra clásica negra — $780',
        '1 × Sudadera marino — $890',
        'Total estimado: $1,670',
      ].join('\n'),
    );
  });
  it('maneja productos sin precio', () => {
    const msg = buildOrderMessage([{ id: 'a', name: 'X', price: null, qty: 3 }], template, formatMXN);
    expect(msg).toContain('3 × X — precio por confirmar');
    expect(msg).toContain('Total estimado: $0');
  });
});

describe('orderTotal', () => {
  it('suma precio por cantidad', () => {
    expect(orderTotal([{ id: 'a', name: 'a', price: 100, qty: 3 }, { id: 'b', name: 'b', price: null, qty: 1 }])).toBe(300);
  });
});
