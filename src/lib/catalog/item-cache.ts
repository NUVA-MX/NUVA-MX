import type { CatalogDetail } from './types';

export type ItemFetcher = (code: string) => Promise<CatalogDetail>;

export type ItemCacheOptions = {
  /** Most products kept (least recently used leave first). */
  max?: number;
  /** Prefetches are skipped while this many requests are already running. */
  maxInFlight?: number;
  /** Wait before a "soon" prefetch fires; a newer one replaces it. */
  soonMs?: number;
};

export type ItemCache = {
  /** The detail from memory, or null if it is not (yet) loaded. */
  peek: (code: string) => CatalogDetail | null;
  /** Memory first, then one shared request per code. A failed request is forgotten, so the next call retries. */
  get: (code: string) => Promise<CatalogDetail>;
  /** Warms the cache now (ignored if cached, running, or the in-flight cap is reached). Never rejects. */
  prefetch: (code: string) => void;
  /** Like prefetch, after a short pause; sweeping over many cards only warms the last one. */
  prefetchSoon: (code: string) => void;
  cancelSoon: () => void;
};

type Entry = { promise: Promise<CatalogDetail>; value: CatalogDetail | null };

/** In-memory cache of product details: deduped in-flight requests, small LRU, no caching of failures. */
export function createItemCache(fetcher: ItemFetcher, options: ItemCacheOptions = {}): ItemCache {
  const { max = 50, maxInFlight = 2, soonMs = 80 } = options;
  const entries = new Map<string, Entry>();
  let inFlight = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function touch(code: string, entry: Entry): void {
    entries.delete(code);
    entries.set(code, entry);
    while (entries.size > max) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
  }

  function get(code: string): Promise<CatalogDetail> {
    const hit = entries.get(code);
    if (hit) {
      touch(code, hit);
      return hit.promise;
    }
    inFlight += 1;
    const entry: Entry = { value: null, promise: Promise.resolve(null as unknown as CatalogDetail) };
    entry.promise = fetcher(code).then(
      (value) => {
        inFlight -= 1;
        entry.value = value;
        return value;
      },
      (err: unknown) => {
        inFlight -= 1;
        if (entries.get(code) === entry) entries.delete(code);
        throw err;
      },
    );
    touch(code, entry);
    return entry.promise;
  }

  function prefetch(code: string): void {
    if (entries.has(code) || inFlight >= maxInFlight) return;
    get(code).catch(() => undefined);
  }

  function cancelSoon(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  return {
    peek: (code) => entries.get(code)?.value ?? null,
    get,
    prefetch,
    prefetchSoon: (code) => {
      cancelSoon();
      timer = setTimeout(() => {
        timer = null;
        prefetch(code);
      }, soonMs);
    },
    cancelSoon,
  };
}
