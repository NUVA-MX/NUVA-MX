// Shape guards for the catalog API responses (the browser never trusts the network).
import { toSafeImageUrl } from './images';
import type {
  CatalogAvailability,
  CatalogCard,
  CatalogCategoriesResponse,
  CatalogColor,
  CatalogDetail,
  CatalogListResponse,
  CatalogSpecs,
  CatalogVariant,
} from './types';

const AVAILABILITY: readonly string[] = ['available', 'low', 'out', 'unknown'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 2048): string | null => (typeof v === 'string' && v.length <= max ? v : null);
const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const nonNegInt = (v: unknown): number => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : 0);

/** A sane non-negative amount in pesos (cents allowed), else null. */
function price(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1_000_000 ? v : null;
}

function availability(v: unknown): CatalogAvailability {
  return typeof v === 'string' && AVAILABILITY.includes(v) ? (v as CatalogAvailability) : 'unknown';
}

function color(v: unknown): CatalogColor | null {
  if (!isObj(v)) return null;
  const tone = str(v.tone, 60);
  if (!tone) return null;
  const hex = str(v.hex, 7);
  return { tone, hex: hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : null };
}

export function parseCard(v: unknown): CatalogCard | null {
  if (!isObj(v)) return null;
  const code = str(v.code, 30);
  const name = str(v.name, 200);
  if (!code || !name) return null;
  return {
    code,
    name,
    category: str(v.category, 80),
    subcategory: str(v.subcategory, 80),
    image: toSafeImageUrl(v.image),
    colors: arr(v.colors, 12).flatMap((c) => color(c) ?? []),
    variantCount: nonNegInt(v.variantCount),
    availability: availability(v.availability),
    price: price(v.price),
  };
}

function variant(v: unknown): CatalogVariant | null {
  const c = color(v);
  if (!c || !isObj(v)) return null;
  const code = str(v.code, 30);
  return code ? { ...c, code, image: toSafeImageUrl(v.image), availability: availability(v.availability) } : null;
}

function specs(v: unknown): CatalogSpecs {
  const o = isObj(v) ? v : {};
  return {
    material: str(o.material, 200),
    size: str(o.size, 200),
    weight: str(o.weight, 200),
    printTechnique: str(o.printTechnique, 200),
    printArea: str(o.printArea, 200),
    packQty: str(o.packQty, 200),
  };
}

export function parseDetail(v: unknown): CatalogDetail | null {
  const card = parseCard(v);
  if (!card || !isObj(v)) return null;
  return {
    ...card,
    description: str(v.description, 2000),
    images: arr(v.images, 8).flatMap((i) => toSafeImageUrl(i) ?? []),
    variants: arr(v.variants, 40).flatMap((x) => variant(x) ?? []),
    specs: specs(v.specs),
  };
}

export function parseListResponse(v: unknown): CatalogListResponse | null {
  if (!isObj(v) || typeof v.enabled !== 'boolean') return null;
  return {
    enabled: v.enabled,
    items: arr(v.items, 48).flatMap((i) => parseCard(i) ?? []),
    page: nonNegInt(v.page) || 1,
    pageSize: nonNegInt(v.pageSize) || 24,
    total: nonNegInt(v.total),
    updatedAt: str(v.updatedAt, 40),
  };
}

export function parseCategoriesResponse(v: unknown): CatalogCategoriesResponse | null {
  if (!isObj(v) || typeof v.enabled !== 'boolean') return null;
  const categories = arr(v.categories, 200).flatMap((c) => {
    if (!isObj(c)) return [];
    const name = str(c.name, 80);
    if (!name) return [];
    return [{ name, count: nonNegInt(c.count), subcategories: arr(c.subcategories, 200).flatMap((s) => str(s, 80) ?? []) }];
  });
  return { enabled: v.enabled, categories };
}
