// Promo dates are calendar days in America/Mexico_City. Mexico abolished DST in 2022, so the zone is a
// fixed UTC-6 and plain arithmetic is exact (no Intl/timezone database needed, also safe in the browser).
// If Mexico ever reintroduces DST this module is the only place to change.

const MX_OFFSET_HOURS = 6; // local = UTC - 6

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date in YYYY-MM-DD form. */
export function isValidDay(value: string): boolean {
  const m = DAY.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

function parts(day: string): [number, number, number] {
  if (!isValidDay(day)) throw new RangeError('Invalid day (expected YYYY-MM-DD)');
  const m = DAY.exec(day)!;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** UTC instant of 00:00:00.000 Mexico City time on `day` (inclusive start of the window). */
export function mxDayStartUtc(day: string): Date {
  const [y, m, d] = parts(day);
  return new Date(Date.UTC(y, m - 1, d, MX_OFFSET_HOURS));
}

/**
 * UTC instant of 00:00:00.000 Mexico City time on the day AFTER `day`: the exclusive end of a window
 * that includes all of `day` (through 23:59:59.999 local).
 */
export function mxDayEndUtc(day: string): Date {
  const [y, m, d] = parts(day);
  return new Date(Date.UTC(y, m - 1, d + 1, MX_OFFSET_HOURS));
}
