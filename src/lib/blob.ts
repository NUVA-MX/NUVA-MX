// Pure Vercel Blob helpers (no secrets: only the public host is derived from the token).

export const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';
export const UPLOAD_PREFIXES = ['productos/', 'encargo/'] as const;
export type UploadPrefix = (typeof UPLOAD_PREFIXES)[number];
/** Default prefix (product photos). */
export const UPLOAD_PREFIX: UploadPrefix = 'productos/';

/**
 * Public host of the store that BLOB_READ_WRITE_TOKEN belongs to.
 * Token format: vercel_blob_rw_<storeId>_<secret> (same parsing as @vercel/blob).
 * Returns null when the token is missing or has an unexpected shape.
 */
export function blobPublicHost(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split('_');
  const storeId = parts[3] ?? '';
  if (parts[0] !== 'vercel' || parts[1] !== 'blob' || parts[2] !== 'rw') return null;
  if (!/^[A-Za-z0-9]{4,64}$/.test(storeId)) return null;
  return `${storeId.toLowerCase()}${BLOB_HOST_SUFFIX}`;
}

/**
 * Upload pathnames must be `<prefix><safe-name>` with prefix `productos/` or `encargo/` (or the one passed):
 * lowercase letters, digits, dots and dashes, one path segment only.
 */
export function isSafeUploadPath(pathname: string, prefix?: UploadPrefix): boolean {
  const allowed: readonly string[] = prefix ? [prefix] : UPLOAD_PREFIXES;
  const match = allowed.find((p) => pathname.startsWith(p));
  if (!match) return false;
  const name = pathname.slice(match.length);
  return /^[a-z0-9][a-z0-9.-]{0,99}$/.test(name) && !name.includes('..');
}
