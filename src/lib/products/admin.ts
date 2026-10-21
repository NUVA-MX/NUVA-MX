import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { products, type ProductRow } from '@/lib/db/schema';
import { uuidSchema } from './validation';

/** All products, hidden ones included (admin only). */
export async function listAllProducts(): Promise<ProductRow[]> {
  return getDb().select().from(products).orderBy(asc(products.sortOrder), asc(products.createdAt));
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  if (!uuidSchema.safeParse(id).success) return null;
  const [row] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}
