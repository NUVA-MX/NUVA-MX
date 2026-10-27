import 'server-only';
import { z } from 'zod';
import { CATALOG_DEFAULT_PAGE_SIZE, CATALOG_DEFAULT_SORT, CATALOG_SORTS, CATALOG_MAX_FILTER, CATALOG_MAX_PAGE, CATALOG_MAX_QUERY, CATALOG_PAGE_SIZES } from '@/lib/catalog/types';

const filter = z.string().trim().max(CATALOG_MAX_FILTER).optional();

export const listQuerySchema = z.object({
  q: z.string().trim().max(CATALOG_MAX_QUERY).optional(),
  category: filter,
  subcategory: filter,
  sort: z.enum(CATALOG_SORTS).default(CATALOG_DEFAULT_SORT),
  page: z.coerce.number().int().min(1).max(CATALOG_MAX_PAGE).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((n) => (CATALOG_PAGE_SIZES as readonly number[]).includes(n), { message: 'invalid page size' })
    .default(CATALOG_DEFAULT_PAGE_SIZE),
});

/**
 * Reads and validates the list query string; null when anything is out of range. Price sorts are accepted only
 * while prices are visible, so the API never offers an ordering by supplier cost when prices are hidden.
 */
export function parseListQuery(url: URL, opts: { pricesVisible: boolean }): z.infer<typeof listQuerySchema> | null {
  const raw: Record<string, string> = {};
  for (const key of ['q', 'category', 'subcategory', 'sort', 'page', 'pageSize']) {
    const value = url.searchParams.get(key);
    if (value !== null && value !== '') raw[key] = value;
  }
  const parsed = listQuerySchema.safeParse(raw);
  if (!parsed.success) return null;
  if (parsed.data.sort !== 'name' && !opts.pricesVisible) return null;
  return parsed.data;
}
