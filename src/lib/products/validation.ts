import { z } from 'zod';
import { BLOB_HOST_SUFFIX } from '@/lib/blob';

/** Postgres `integer` upper bound; nothing above this may reach the database. */
export const MAX_DB_INT = 2_147_483_647;

/** Business limits for the admin form (all well below MAX_DB_INT). */
export const PRODUCT_LIMITS = {
  price: 1_000_000,
  stock: 1_000_000,
  sortOrder: 100_000,
} as const;

/** '' -> null, otherwise trimmed string with a max length. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v));

/** '' -> null, otherwise a whole number between 0 and `max`. */
const optionalInt = (max: number) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return null;
      const n = /^\d{1,10}$/.test(v) ? Number(v) : NaN;
      if (!Number.isInteger(n) || n > Math.min(max, MAX_DB_INT)) {
        ctx.addIssue({ code: 'custom', message: 'int' });
        return z.NEVER;
      }
      return n;
    });

/**
 * Empty, or an https URL on the Vercel Blob public host.
 * With `allowedHost` (derived from the store's token) only that exact store is accepted.
 */
export function isAllowedImageUrl(value: string, allowedHost?: string | null): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    return allowedHost ? url.hostname === allowedHost : url.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** Product image: canonical https URL on our Blob host, under /productos/ (never another store or folder). */
export function isProductImageUrl(value: string, host?: string | null): boolean {
  if (typeof value !== 'string' || value.length > 2048 || !host) return false;
  if (/[?#\\]|\.\./.test(value) || /%(2e|2f|5c)/i.test(value)) return false;
  if (!isAllowedImageUrl(value, host)) return false;
  try {
    const url = new URL(value);
    return url.href === value && /^\/productos\/[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function productFormSchema(allowedImageHost?: string | null) {
  return z.object({
    name: z.string().trim().min(1).max(120),
    meta: optionalText(200),
    price: optionalInt(PRODUCT_LIMITS.price),
    stock: optionalInt(PRODUCT_LIMITS.stock),
    category: optionalText(60),
    imageUrl: z
      .string()
      .trim()
      .max(2048)
      .refine((v) => v === '' || isProductImageUrl(v, allowedImageHost))
      .transform((v) => (v === '' ? null : v)),
    imageAlt: optionalText(200),
    visible: z.boolean(),
    sortOrder: optionalInt(PRODUCT_LIMITS.sortOrder).transform((v) => v ?? 0),
  });
}

export type ProductFormValues = z.output<ReturnType<typeof productFormSchema>>;
export type ProductFormField = keyof ProductFormValues;

/** Reads the admin form fields from FormData (checkbox -> boolean). */
export function readProductForm(formData: FormData, options: { imageHost?: string | null } = {}) {
  const get = (key: string) => {
    const v = formData.get(key);
    return typeof v === 'string' ? v : '';
  };
  return productFormSchema(options.imageHost).safeParse({
    name: get('name'),
    meta: get('meta'),
    price: get('price'),
    stock: get('stock'),
    category: get('category'),
    imageUrl: get('imageUrl'),
    imageAlt: get('imageAlt'),
    visible: formData.get('visible') === 'on',
    sortOrder: get('sortOrder'),
  });
}

export const uuidSchema = z.uuid();
