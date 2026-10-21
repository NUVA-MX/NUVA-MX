import { describe, expect, it } from 'vitest';
import { fillTemplate, formatMXN } from '../format';

describe('formatMXN', () => {
  it('formatea pesos sin decimales', () => {
    expect(formatMXN(390)).toBe('$390');
    expect(formatMXN(1780)).toBe('$1,780');
    expect(formatMXN(0)).toBe('$0');
  });
  it('redondea decimales', () => {
    expect(formatMXN(99.6)).toBe('$100');
  });
});

describe('fillTemplate', () => {
  it('sustituye claves', () => {
    expect(fillTemplate('ÚLTIMAS {n}', { n: 3 })).toBe('ÚLTIMAS 3');
  });
  it('deja vacías las claves que faltan', () => {
    expect(fillTemplate('a {x} b', {})).toBe('a  b');
  });
});
