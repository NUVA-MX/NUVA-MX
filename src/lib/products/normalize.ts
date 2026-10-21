import type { Product } from './types';

// TODO(confirm): if the API shape changes, this is the only place to adjust.

function str(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

function int(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/** Converts a raw object into a Product. Missing fields -> null. No id or name -> null. */
export function normalize(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'number' ? String(r.id) : str(r.id);
  const name = str(r.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    meta: str(r.meta),
    price: int(r.price),
    stock: int(r.stock),
    image: str(r.image),
    imageAlt: str(r.imageAlt),
    category: str(r.category),
  };
}

export function normalizeList(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalize).filter((p): p is Product => p !== null);
}
