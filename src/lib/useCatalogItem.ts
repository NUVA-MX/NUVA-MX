'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CatalogDetail } from '@/lib/catalog/types';
import { catalogItems } from '@/lib/catalogItemCache';

export type CatalogItemState = { status: 'idle' | 'loading' | 'success' | 'error'; product: CatalogDetail | null };

type Settled = { forCode: string | null; attempt: number; status: 'success' | 'error'; product: CatalogDetail | null };

/**
 * Detail of one product when `code` is set. A product already in the cache (opened or prefetched) is returned on the
 * first render; otherwise `loading` until it arrives. Stale answers (A opened, then B) are ignored. `retry()` asks again.
 */
export function useCatalogItem(code: string | null): CatalogItemState & { retry: () => void } {
  const [settled, setSettled] = useState<Settled>({ forCode: null, attempt: 0, status: 'error', product: null });
  const [attempt, setAttempt] = useState(0);
  const [lastCode, setLastCode] = useState(code);
  // A new (or closed) product starts clean: an old error must not show when the same code is opened again.
  if (code !== lastCode) {
    setLastCode(code);
    setSettled({ forCode: null, attempt: 0, status: 'error', product: null });
    setAttempt(0);
  }
  const cached = code ? catalogItems.peek(code) : null;

  useEffect(() => {
    if (!code || catalogItems.peek(code)) return;
    let current = true;
    catalogItems
      .get(code)
      .then((product) => current && setSettled({ forCode: code, attempt, status: 'success', product }))
      .catch((err: unknown) => {
        if (!current) return;
        console.warn('[useCatalogItem]', err);
        setSettled({ forCode: code, attempt, status: 'error', product: null });
      });
    return () => {
      current = false;
    };
  }, [code, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (!code) return { status: 'idle', product: null, retry };
  if (cached) return { status: 'success', product: cached, retry };
  if (settled.forCode === code && settled.attempt === attempt) return { status: settled.status, product: settled.product, retry };
  return { status: 'loading', product: null, retry };
}
