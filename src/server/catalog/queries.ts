import 'server-only';
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { CatalogSort } from '@/lib/catalog/types';
import { getDb } from '@/lib/db/client';
import { supplierProducts as t, supplierSyncRuns } from '@/lib/db/schema';
import type { PublicCardRow, PublicDetailRow, PublicVariantRow } from './public';
import { likePatterns } from './search';

// Explicit column lists. `costCents` is selected only so the price can be derived server-side (see public.ts); it is never serialized.
const cardColumns = {
  code: t.code,
  name: t.name,
  category: t.category,
  subcategory: t.subcategory,
  image: t.image,
  variants: t.variants,
  totalStock: t.totalStock,
  costCents: t.costCents,
};
const detailColumns = { ...cardColumns, description: t.description, images: t.images, specs: t.specs };

export type ListFilters = { q?: string; category?: string; subcategory?: string; sort?: CatalogSort; page: number; pageSize: number };

/** Cost used for ordering only; rows without a positive cost sort last (they have no public price). */
const sortCost = sql`(case when ${t.costCents} > 0 then ${t.costCents} end)`;

export function orderFor(sort: CatalogSort | undefined): SQL[] {
  const tail = [asc(t.category), asc(t.name), asc(t.code)];
  if (sort === 'price_asc') return [sql`${sortCost} asc nulls last`, ...tail];
  if (sort === 'price_desc') return [sql`${sortCost} desc nulls last`, ...tail];
  return tail;
}

const isText = (v: unknown): v is string => typeof v === 'string';
const textOrNull = (v: unknown): string | null => (isText(v) ? v : null);

function asVariants(raw: unknown): PublicVariantRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((v: unknown) => {
    if (typeof v !== 'object' || v === null) return [];
    const o = v as Record<string, unknown>;
    if (!isText(o.code) || !isText(o.tone)) return [];
    return [{ code: o.code, tone: o.tone, hex: textOrNull(o.hex), image: textOrNull(o.image), stock: typeof o.stock === 'number' ? o.stock : null }];
  });
}

type CardDbRow = { [K in keyof typeof cardColumns]: unknown };

function toCardRow(r: CardDbRow): PublicCardRow {
  return {
    code: String(r.code),
    name: String(r.name),
    category: textOrNull(r.category),
    subcategory: textOrNull(r.subcategory),
    image: textOrNull(r.image),
    variants: asVariants(r.variants),
    totalStock: typeof r.totalStock === 'number' ? r.totalStock : null,
    costCents: typeof r.costCents === 'number' ? r.costCents : null,
  };
}

function whereFor(f: Pick<ListFilters, 'q' | 'category' | 'subcategory'>): SQL | undefined {
  const parts: SQL[] = [eq(t.active, true)];
  if (f.category) parts.push(eq(t.category, f.category));
  if (f.subcategory) parts.push(eq(t.subcategory, f.subcategory));
  for (const pattern of likePatterns(f.q ?? '')) parts.push(sql`${t.searchText} ILIKE ${pattern} ESCAPE '\\'`);
  return and(...parts);
}

export async function listProducts(f: ListFilters): Promise<{ rows: PublicCardRow[]; total: number }> {
  const db = getDb();
  const where = whereFor(f);
  const [rows, totals] = await Promise.all([
    db
      .select(cardColumns)
      .from(t)
      .where(where)
      .orderBy(...orderFor(f.sort))
      .limit(f.pageSize)
      .offset((f.page - 1) * f.pageSize),
    db.select({ n: count() }).from(t).where(where),
  ]);
  return { rows: rows.map(toCardRow), total: totals[0]?.n ?? 0 };
}

export async function getProductByCode(code: string): Promise<PublicDetailRow | null> {
  const [row] = await getDb().select(detailColumns).from(t).where(and(eq(t.code, code), eq(t.active, true))).limit(1);
  if (!row) return null;
  const specs = typeof row.specs === 'object' && row.specs !== null ? (row.specs as Record<string, unknown>) : {};
  return {
    ...toCardRow(row),
    description: textOrNull(row.description),
    images: Array.isArray(row.images) ? row.images.filter(isText) : [],
    specs: {
      material: textOrNull(specs.material),
      size: textOrNull(specs.size),
      weight: textOrNull(specs.weight),
      printTechnique: textOrNull(specs.printTechnique),
      printArea: textOrNull(specs.printArea),
      packQty: textOrNull(specs.packQty),
    },
  };
}

export type CategoryCount = { category: string; subcategory: string | null; n: number };

export async function listCategoryCounts(): Promise<CategoryCount[]> {
  const rows = await getDb()
    .select({ category: t.category, subcategory: t.subcategory, n: count() })
    .from(t)
    .where(and(eq(t.active, true), sql`${t.category} is not null`))
    .groupBy(t.category, t.subcategory)
    .orderBy(asc(t.category), asc(t.subcategory));
  return rows.flatMap((r) => (r.category ? [{ category: r.category, subcategory: r.subcategory, n: r.n }] : []));
}

/** When the last successful sync finished (the freshness of the snapshot), or null. */
export async function lastSuccessfulSyncAt(): Promise<Date | null> {
  const [row] = await getDb()
    .select({ at: supplierSyncRuns.finishedAt })
    .from(supplierSyncRuns)
    .where(eq(supplierSyncRuns.status, 'success'))
    .orderBy(desc(supplierSyncRuns.finishedAt))
    .limit(1);
  return row?.at ?? null;
}

export async function activeProductCount(): Promise<number> {
  const [row] = await getDb().select({ n: count() }).from(t).where(eq(t.active, true));
  return row?.n ?? 0;
}
