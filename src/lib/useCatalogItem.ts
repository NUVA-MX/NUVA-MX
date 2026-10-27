'use client';

import { useEffect, useState } from 'react';
import { fetchCatalogItem } from '@/lib/api/catalog';
import type { CatalogDetail } from '@/lib/catalog/types';

export type CatalogItemState = { status: 'idle' | 'loading' | 'success' | 'error'; product: CatalogDetail | null };

/** Loads one product's detail when `code` is set; resets when it is null. */
export function useCatalogItem(code: string | null): CatalogItemState {
  const [state, setState] = useState<CatalogItemState & { forCode: string | null }>({ status: 'idle', product: null, forCode: null });

  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    fetchCatalogItem(code, controller.signal)
      .then((product) => setState({ status: 'success', product, forCode: code }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[useCatalogItem]', err);
        setState({ status: 'error', product: null, forCode: code });
      });
    return () => controller.abort();
  }, [code]);

  if (!code) return { status: 'idle', product: null };
  if (state.forCode !== code) return { status: 'loading', product: null };
  return { status: state.status, product: state.product };
}
