import 'server-only';
import { CATALOG_CODE_PATTERN } from '@/lib/catalog/types';

// Control (incl. NUL), format (zero-width, bidi, BOM), lone surrogates, private-use and line/paragraph separators.
// Lone surrogates and NUL are rejected by PostgreSQL text/jsonb, so they must never reach the upsert.
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}\p{Co}]/gu;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const MAX_COST_CENTS = 100_000_000;

/** Trims, strips control and invisible characters, collapses whitespace, caps the length. Empty becomes null. */
export function cleanText(raw: unknown, max: number): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(INVISIBLE, ' ').replace(/\s+/g, ' ').trim();
  // Cut by code points so an emoji is never split into a lone surrogate.
  const text = Array.from(cleaned).slice(0, max).join('').trim();
  return text === '' ? null : text;
}

/** Joins a list of values into one capped line ("a, b"). */
export function cleanList(raw: readonly string[], max: number): string | null {
  const parts = raw.flatMap((v) => cleanText(v, max) ?? []);
  return cleanText(parts.join(', '), max);
}

/** Uppercased code that matches the catalog code pattern, else null. */
export function cleanCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return CATALOG_CODE_PATTERN.test(code) ? code : null;
}

/** "#RRGGBB" (uppercase) or null. Anything else, such as CSS fragments, is dropped. */
export function cleanHex(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const hex = raw.trim();
  return HEX.test(hex) ? hex.toUpperCase() : null;
}

/** Supplier price text/number to integer cents, or null when it is not a sane non-negative amount. */
export function toCostCents(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw.replace(',', '.').trim()) : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  const cents = Math.round(n * 100);
  return cents <= MAX_COST_CENTS ? cents : null;
}

/** Non-negative whole number from supplier text/number (stock), or null. */
export function toStock(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw.trim()) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= 2_000_000_000 ? Math.floor(n) : null;
}
