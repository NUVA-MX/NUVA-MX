import { describe, expect, it } from 'vitest';
import { isValidDay, mxDayEndUtc, mxDayStartUtc } from '../mx-date';

describe('mx-date', () => {
  it('start of day is 06:00 UTC', () => {
    expect(mxDayStartUtc('2026-10-05').toISOString()).toBe('2026-10-05T06:00:00.000Z');
  });
  it('end is the exclusive next-day midnight (handles month and year ends)', () => {
    expect(mxDayEndUtc('2026-10-05').toISOString()).toBe('2026-10-06T06:00:00.000Z');
    expect(mxDayEndUtc('2026-10-31').toISOString()).toBe('2026-11-01T06:00:00.000Z');
    expect(mxDayEndUtc('2026-12-31').toISOString()).toBe('2027-01-01T06:00:00.000Z');
  });
  it('validates real calendar days only', () => {
    expect(isValidDay('2026-02-29')).toBe(false);
    expect(isValidDay('2028-02-29')).toBe(true);
    expect(isValidDay('2026-13-01')).toBe(false);
    expect(isValidDay('2026-1-1')).toBe(false);
    expect(() => mxDayStartUtc('nope')).toThrow();
  });
});
