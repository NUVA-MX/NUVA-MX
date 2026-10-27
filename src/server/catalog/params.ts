import 'server-only';
import { z } from 'zod';
import { CATALOG_DEFAULT_PAGE_SIZE, CATALOG_MAX_FILTER, CATALOG_MAX_PAGE, CATALOG_MAX_QUERY, CATALOG_PAGE_SIZES } from '@/lib/catalog/types';

const filter = z.string().trim().max(CATALOG_MAX_FILTER).optional();

export const listQuerySchema = z.object({
  q: z.string().trim().max(CATALOG_MAX_QUERY).optional(),
  category: filter,
  subcategory: filter,
  page: z.coerce.number().int().min(1).max(CATALOG_MAX_PAGE).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((n) => (CATALOG_PAGE_SIZES as readonly number[]).includes(n), { message: 'invalid page size' })
    .default(CATALOG_DEFAULT_PAGE_SIZE),
});

/** Reads and validates the list query string; null when anything is out of range. */
export function parseListQuery(url: URL): z.infer<typeof listQuerySchema> | null {
  const raw: Record<string, string> = {};
  for (const key of ['q', 'category', 'subcategory', 'page', 'pageSize']) {
    const value = url.searchParams.get(key);
    if (value !== null && value !== '') raw[key] = value;
  }
  const parsed = listQuerySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
