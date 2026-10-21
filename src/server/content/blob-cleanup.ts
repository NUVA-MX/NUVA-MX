import 'server-only';
import { del } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { isEncargoImageUrl } from '@/lib/content/encargo-schema';
import { getDb } from '@/lib/db/client';
import { encargoProjects, products, siteContent } from '@/lib/db/schema';
import { isProductImageUrl } from '@/lib/products/validation';
import { blobToken } from '@/server/env';
import { log } from '@/server/log/logger';

export type BlobFolder = 'encargo' | 'productos';

const canon = (s: string): string => {
  try {
    return new URL(s).href;
  } catch {
    return s;
  }
};

function collectStrings(v: unknown, out: Set<string>) {
  if (typeof v === 'string') out.add(canon(v));
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach((x) => collectStrings(x, out));
}

/**
 * Deletes replaced blobs, but only when it is certain they are ours and dead. Each caller may only delete
 * its own folder (`encargo/` or `productos/`) on our host, in canonical form, and only when no table still
 * references the blob: products, encargo_projects and site_content (raw JSON, so even a corrupted section
 * counts). References are compared in canonical form. Runs after the write committed. Never throws.
 */
export async function deleteUnreferencedBlobs(
  candidates: readonly (string | null | undefined)[],
  host: string | null,
  folder: BlobFolder,
): Promise<void> {
  try {
    const valid = folder === 'encargo' ? isEncargoImageUrl : isProductImageUrl;
    const urls = [...new Set(candidates.filter((u): u is string => typeof u === 'string').map(canon))].filter((u) =>
      valid(u, host),
    );
    if (urls.length === 0 || !blobToken()) return;
    const db = getDb();
    const [content] = await db.select({ data: siteContent.data }).from(siteContent).where(eq(siteContent.key, 'encargo')).limit(1);
    const productUrls = await db.select({ url: products.imageUrl }).from(products);
    const projectUrls = await db.select({ url: encargoProjects.imageUrl }).from(encargoProjects);
    const referenced = new Set<string>();
    for (const r of [...productUrls, ...projectUrls]) if (r.url) referenced.add(canon(r.url));
    collectStrings(content?.data ?? {}, referenced);
    for (const url of urls) {
      if (referenced.has(url)) continue;
      try {
        await del(url);
      } catch (err) {
        log.error('encargo.blob_delete_failed', { folder, error: err });
      }
    }
  } catch (err) {
    log.error('encargo.blob_cleanup_failed', { folder, error: err });
  }
}
