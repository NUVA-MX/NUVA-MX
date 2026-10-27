import { describe, expect, it } from 'vitest';
import { isInSupplierWindow } from '../window';

// Mexico City is UTC-6 all year (no DST since 2022).
const at = (utc: string) => isInSupplierWindow(new Date(`2026-10-26T${utc}:00Z`));

describe('isInSupplierWindow', () => {
  it('is true inside the three windows (CDMX 09:00, 13:30, 17:59)', () => {
    expect(at('15:00')).toBe(true);
    expect(at('19:30')).toBe(true);
    expect(at('23:59')).toBe(true);
  });
  it('is false outside (CDMX 08:59, 10:00, 23:00)', () => {
    expect(at('14:59')).toBe(false);
    expect(at('16:00')).toBe(false);
    expect(at('05:00')).toBe(false);
  });
  it('also holds in a summer month', () => {
    expect(isInSupplierWindow(new Date('2026-07-15T15:00:00Z'))).toBe(true);
  });
});
