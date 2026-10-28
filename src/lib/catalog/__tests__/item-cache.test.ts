import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createItemCache } from '../item-cache';
import type { CatalogDetail } from '../types';

const detail = (code: string): CatalogDetail => ({ code, name: code }) as unknown as CatalogDetail;

type Deferred = { code: string; resolve: () => void; reject: () => void };

function fakeFetch() {
  const calls: Deferred[] = [];
  const fetcher = vi.fn(
    (code: string) =>
      new Promise<CatalogDetail>((resolve, reject) => {
        calls.push({ code, resolve: () => resolve(detail(code)), reject: () => reject(new Error('boom')) });
      }),
  );
  return { fetcher, calls };
}

describe('item cache', () => {
  it('shares one request between callers and serves memory afterwards', async () => {
    const { fetcher, calls } = fakeFetch();
    const cache = createItemCache(fetcher);
    const a = cache.get('A');
    const b = cache.get('A');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(cache.peek('A')).toBeNull();
    calls[0].resolve();
    await expect(a).resolves.toMatchObject({ code: 'A' });
    await b;
    expect(cache.peek('A')).toMatchObject({ code: 'A' });
    await cache.get('A');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const { fetcher, calls } = fakeFetch();
    const cache = createItemCache(fetcher);
    const first = cache.get('A');
    calls[0].reject();
    await expect(first).rejects.toThrow('boom');
    expect(cache.peek('A')).toBeNull();
    const second = cache.get('A');
    expect(fetcher).toHaveBeenCalledTimes(2);
    calls[1].resolve();
    await expect(second).resolves.toMatchObject({ code: 'A' });
  });

  it('evicts the least recently used product past the cap', async () => {
    const fetcher = vi.fn((code: string) => Promise.resolve(detail(code)));
    const cache = createItemCache(fetcher, { max: 2 });
    await cache.get('A');
    await cache.get('B');
    await cache.get('A');
    await cache.get('C');
    expect(cache.peek('B')).toBeNull();
    expect(cache.peek('A')).not.toBeNull();
    expect(cache.peek('C')).not.toBeNull();
  });

  it('prefetch skips known codes and respects the in-flight cap, never rejecting', async () => {
    const { fetcher, calls } = fakeFetch();
    const cache = createItemCache(fetcher, { maxInFlight: 2 });
    cache.prefetch('A');
    cache.prefetch('A');
    cache.prefetch('B');
    cache.prefetch('C');
    expect(fetcher).toHaveBeenCalledTimes(2);
    calls[0].reject();
    await Promise.resolve();
    await Promise.resolve();
    cache.prefetch('C');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('a direct get is not blocked by the prefetch cap', () => {
    const { fetcher } = fakeFetch();
    const cache = createItemCache(fetcher, { maxInFlight: 1 });
    cache.prefetch('A');
    cache.get('B').catch(() => undefined);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('prefetchSoon', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits, and only the last code of a sweep is fetched', () => {
    const { fetcher } = fakeFetch();
    const cache = createItemCache(fetcher, { soonMs: 80 });
    cache.prefetchSoon('A');
    vi.advanceTimersByTime(40);
    cache.prefetchSoon('B');
    vi.advanceTimersByTime(79);
    expect(fetcher).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('B');
  });

  it('cancelSoon drops the pending prefetch', () => {
    const { fetcher } = fakeFetch();
    const cache = createItemCache(fetcher);
    cache.prefetchSoon('A');
    cache.cancelSoon();
    vi.advanceTimersByTime(500);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
