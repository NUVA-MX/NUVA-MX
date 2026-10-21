'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api/products';
import type { Product, ProductsStatus } from '@/lib/products/types';

type State = { data: Product[]; status: ProductsStatus };

/** Loads the public products. `retry()` refetches after an error. */
export function useProducts(): State & { retry: () => void } {
  const [state, setState] = useState<State>({ data: [], status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal)
      .then((data) => setState({ data, status: data.length ? 'success' : 'empty' }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[useProducts]', err);
        setState({ data: [], status: 'error' });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ data: [], status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
