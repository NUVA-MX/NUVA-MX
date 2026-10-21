import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { products, type ProductRow } from '@/lib/db/schema';
import type { Product } from './types';

/** Maps a DB row to the public shape. `visible` and timestamps are never sent publicly. */
export function toPublicProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    meta: row.meta,
    price: row.price,
    stock: row.stock,
    image: row.imageUrl,
    imageAlt: row.imageAlt,
    category: row.category,
  };
}

/** Visible products, ordered for the store. */
export async function listPublicProducts(): Promise<Product[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .where(eq(products.visible, true))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));
  return rows.map(toPublicProduct);
}
