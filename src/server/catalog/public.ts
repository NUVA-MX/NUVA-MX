import 'server-only';
import type {
  CatalogAvailability,
  CatalogCard,
  CatalogColor,
  CatalogDetail,
  CatalogSpecs,
  CatalogVariant,
} from '@/lib/catalog/types';

/** Below this many pieces the public label reads "low". */
export const LOW_STOCK_PIECES = 100;
/** A snapshot older than this reports every availability as unknown. */
export const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CARD_COLORS = 12;

/** Row fields the public mapping needs. `costCents` is read only to derive the price and is never copied to any output. */
export type PublicVariantRow = { code: string; tone: string; hex: string | null; image: string | null; stock: number | null };
export type PublicCardRow = {
  code: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  image: string | null;
  variants: PublicVariantRow[];
  totalStock: number | null;
  costCents: number | null;
};
export type PublicDetailRow = PublicCardRow & { description: string | null; images: string[]; specs: CatalogSpecs };

export type PriceRule = { show: boolean; factor: number };
/** Prices off: the default, so callers that pass no rule behave exactly as before. */
export const NO_PRICES: PriceRule = { show: false, factor: 1 };

/**
 * The only place a public price is decided. Null when prices are off or the cost is missing or not positive;
 * otherwise cost x factor in pesos with 2 decimals. The cost itself never leaves the server.
 */
export function publicPrice(costCents: number | null, rule: PriceRule): number | null {
  if (!rule.show || costCents === null || !Number.isFinite(costCents) || costCents <= 0) return null;
  return Math.round(costCents * rule.factor) / 100;
}

export function isStale(snapshotAt: Date | null, now: Date): boolean {
  return !snapshotAt || now.getTime() - snapshotAt.getTime() > STALE_AFTER_MS;
}

export function availabilityOf(stock: number | null, stale: boolean): CatalogAvailability {
  if (stale || stock === null) return 'unknown';
  if (stock <= 0) return 'out';
  return stock < LOW_STOCK_PIECES ? 'low' : 'available';
}

function uniqueColors(variants: readonly PublicVariantRow[]): CatalogColor[] {
  const seen = new Set<string>();
  const out: CatalogColor[] = [];
  for (const v of variants) {
    if (seen.has(v.tone)) continue;
    seen.add(v.tone);
    out.push({ tone: v.tone, hex: v.hex });
    if (out.length >= MAX_CARD_COLORS) break;
  }
  return out;
}

export function toCard(row: PublicCardRow, stale: boolean, rule: PriceRule = NO_PRICES): CatalogCard {
  return {
    code: row.code,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    image: row.image,
    colors: uniqueColors(row.variants),
    variantCount: row.variants.length,
    availability: availabilityOf(row.totalStock, stale),
    price: publicPrice(row.costCents, rule),
  };
}

export function toDetail(row: PublicDetailRow, stale: boolean, rule: PriceRule = NO_PRICES): CatalogDetail {
  const variants: CatalogVariant[] = row.variants.map((v) => ({
    code: v.code,
    tone: v.tone,
    hex: v.hex,
    image: v.image,
    availability: availabilityOf(v.stock, stale),
  }));
  return { ...toCard(row, stale, rule), description: row.description, images: row.images, variants, specs: row.specs };
}
