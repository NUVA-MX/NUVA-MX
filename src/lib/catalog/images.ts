// Pure and import-free: next.config.ts and the server both use it.
export const SUPPLIER_IMAGE_HOST = 'adbsslpenfkpasdnekfj.supabase.co';
export const SUPPLIER_IMAGE_PATH_PREFIX = '/storage/v1/object/public/productos/';
const MAX_URL_LENGTH = 2048;
/** Plain file paths only (the sampled supplier paths are all of this form). */
const SAFE_FILE_PATH = /^[A-Za-z0-9._/-]+$/;

/**
 * Returns a canonical https URL only for images on the exact supplier storage host and path, else null
 * (the UI shows a placeholder). A leading `//` is normalized to `https://`.
 */
export function toSafeImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (text.length === 0 || text.length > MAX_URL_LENGTH) return null;
  // One spelling per image: no fragment, no percent-encoding anywhere (encoded dots, slashes or look-alike names).
  if (/[#%\\]/.test(text)) return null;
  const candidate = text.startsWith('//') ? `https:${text}` : text;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== SUPPLIER_IMAGE_HOST) return null;
  // No query or fragment: the optimizer pattern has an empty `search`, and a query string would be a cache-busting key.
  if (url.username || url.password || url.port || url.search || url.hash) return null;
  if (!url.pathname.startsWith(SUPPLIER_IMAGE_PATH_PREFIX)) return null;
  const rest = url.pathname.slice(SUPPLIER_IMAGE_PATH_PREFIX.length);
  if (!SAFE_FILE_PATH.test(rest) || rest.split('/').some((seg) => seg === '' || seg.startsWith('.'))) return null;
  const out = url.href;
  return out.length <= MAX_URL_LENGTH ? out : null;
}
