import 'server-only';

const ZONE = 'America/Mexico_City';
/** Supplier query windows in Mexico City local hours: 09:00-10:00, 13:00-14:00, 17:00-18:00. */
const WINDOW_START_HOURS: readonly number[] = [9, 13, 17];

const hourFormat = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', hourCycle: 'h23' });

export function isInSupplierWindow(date: Date): boolean {
  const hour = Number(hourFormat.formatToParts(date).find((p) => p.type === 'hour')?.value);
  return WINDOW_START_HOURS.includes(hour);
}
