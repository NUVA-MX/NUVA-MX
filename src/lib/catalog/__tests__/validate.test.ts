import { describe, expect, it } from 'vitest';
import { parseCard } from '../validate';

const base = { code: 'TH-239', name: 'Audífonos', variantCount: 1, availability: 'available' };

describe('parseCard price', () => {
  it('keeps a sane price and drops anything else to null', () => {
    expect(parseCard({ ...base, price: 149.38 })?.price).toBe(149.38);
    for (const bad of [null, undefined, -1, Number.NaN, '149', 2_000_000]) expect(parseCard({ ...base, price: bad })?.price).toBeNull();
  });
});
