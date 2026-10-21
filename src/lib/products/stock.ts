import type { StockState } from './types';

/** 0 -> 'out', <= threshold -> 'low', otherwise -> 'ok', no data -> null. */
export function stockBadgeState(stock: number | null | undefined, threshold: number): StockState | null {
  if (stock === null || stock === undefined || !Number.isFinite(stock)) return null;
  if (stock <= 0) return 'out';
  if (stock <= threshold) return 'low';
  return 'ok';
}
