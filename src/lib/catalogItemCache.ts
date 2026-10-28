import { fetchCatalogItem } from '@/lib/api/catalog';
import { createItemCache } from '@/lib/catalog/item-cache';

/** App-wide cache of product details (the detail window, card prefetch and "+ Agregar" all read through it). */
export const catalogItems = createItemCache((code) => fetchCatalogItem(code));
