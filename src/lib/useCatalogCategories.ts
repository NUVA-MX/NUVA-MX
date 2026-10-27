'use client';

import { useEffect, useState } from 'react';
import { fetchCatalogCategories } from '@/lib/api/catalog';
import type { CatalogCategoriesResponse } from '@/lib/catalog/types';

/** Categories for the filter selects. A failure just leaves the lists empty (the search still works). */
export function useCatalogCategories(): CatalogCategoriesResponse['categories'] {
  const [categories, setCategories] = useState<CatalogCategoriesResponse['categories']>([]);
  useEffect(() => {
    const controller = new AbortController();
    fetchCatalogCategories(controller.signal)
      .then((res) => setCategories(res.categories))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) console.warn('[useCatalogCategories]', err);
      });
    return () => controller.abort();
  }, []);
  return categories;
}
