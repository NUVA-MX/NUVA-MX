'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api/products';
import type { Product, ProductsStatus } from '@/lib/products/types';

type State = { data: Product[]; status: ProductsStatus };

/** Last successful load, kept for the session: coming back to /existencia paints it at once, then refreshes. */
let cached: Product[] | null = null;
let cachedAt = 0;
/** Inside this window the cached list is used as is, with no request. */
const FRESH_MS = 5 * 60 * 1000;

const isFresh = () => cached !== null && Date.now() - cachedAt < FRESH_MS;
let inflight: Promise<Product[]> | null = null;

function load(signal?: AbortSignal): Promise<Product[]> {
  const p = fetchProducts(signal).then((data) => {
    cached = data;
    cachedAt = Date.now();
    return data;
  });
  return p;
}

/** Starts loading the products in the background (e.g. while the visitor is still on /encargo). Never throws. */
export function warmProducts(): void {
  if (isFresh() || inflight) return;
  inflight = load()
    .catch(() => [] as Product[])
    .finally(() => {
      inflight = null;
    });
}

function fromCache(): State {
  return cached ? { data: cached, status: cached.length ? 'success' : 'empty' } : { data: [], status: 'loading' };
}

/** Loads the public products. `retry()` refetches after an error. */
export function useProducts(): State & { retry: () => void } {
  const [state, setState] = useState<State>(fromCache);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0 && isFresh()) return; // already loaded: no request
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => setState({ data, status: data.length ? 'success' : 'empty' }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[useProducts]', err);
        // Keep showing the last good list if a refresh fails.
        setState((s) => (s.data.length ? s : { data: [], status: 'error' }));
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    cached = null;
    setState({ data: [], status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
