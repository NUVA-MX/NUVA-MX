import { describe, expect, it } from 'vitest';
import { stockBadgeState } from '../products/stock';

describe('stockBadgeState', () => {
  it.each([
    [0, 'out'],
    [1, 'low'],
    [3, 'low'],
    [5, 'low'],
    [6, 'ok'],
    [22, 'ok'],
  ] as const)('stock %i -> %s', (stock, expected) => {
    expect(stockBadgeState(stock, 5)).toBe(expected);
  });
  it('sin dato -> null', () => {
    expect(stockBadgeState(null, 5)).toBeNull();
    expect(stockBadgeState(undefined, 5)).toBeNull();
  });
});
