// The only place in the frontend that calls the products API.
import { normalizeList } from '@/lib/products/normalize';
import type { Product } from '@/lib/products/types';

export class ProductsError extends Error {
  constructor(public status: number) {
    super(`products request failed: ${status}`);
  }
}

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const res = await fetch('/api/products', { cache: 'no-store', signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new ProductsError(res.status);
  const body: unknown = await res.json();
  return normalizeList((body as { products?: unknown } | null)?.products);
}
