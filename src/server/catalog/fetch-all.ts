import 'server-only';
import type { InnovationClient, InnovationProduct } from '@/server/integrations';
import { buildStockIndex, buildToneIndex, type StockIndex, type ToneIndex } from './normalize';

/** Hard stop for runaway pagination (1450 products at 100 per page is 15 pages). */
export const MAX_PAGES = 60;
/** Rows per page requested from the supplier (honored by it). A shorter non-last page means a partial response. */
export const PAGE_SIZE = 100;
/** The supplier allows 60 calls per minute; keep call STARTS at least this far apart (slow calls need no extra wait). */
export const CALL_SPACING_MS = 1_100;

/** A sync-level failure with a stable, non-sensitive kind. */
export class SyncAbort extends Error {
  constructor(public readonly kind: 'budget' | 'too_many_pages' | 'empty' | 'shrink_guard' | 'window_closed' | 'short_page' | 'inconsistent_pages') {
    super(`sync aborted: ${kind}`);
    this.name = 'SyncAbort';
  }
}

export type FetchedCatalog = {
  products: InnovationProduct[];
  rejected: number;
  tones: ToneIndex;
  stock: StockIndex;
};

export type FetchClock = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  budgetMs: number;
  /** False once the supplier query window has closed. */
  windowOpen: () => boolean;
};

/** Colors, then the stock list, then every product page, paced from the start of the previous call and bounded by the time budget. */
export async function fetchCatalog(client: InnovationClient, clock: FetchClock): Promise<FetchedCatalog> {
  const started = clock.now();
  let lastStart: number | null = null;
  const remaining = (): number => clock.budgetMs - (clock.now() - started);
  const pace = async (): Promise<void> => {
    if (remaining() <= 0) throw new SyncAbort('budget');
    if (!clock.windowOpen()) throw new SyncAbort('window_closed');
    if (lastStart !== null) {
      const wait = CALL_SPACING_MS - (clock.now() - lastStart);
      if (wait > 0) await clock.sleep(wait);
    }
    lastStart = clock.now();
  };
  /** A call that outlives the budget ends the run (so the lock is released before the function is killed). */
  const bounded = async <T>(call: Promise<T>): Promise<T> => {
    const left = remaining();
    if (left <= 0) throw new SyncAbort('budget');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const limit = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new SyncAbort('budget')), left);
    });
    try {
      return await Promise.race([call, limit]);
    } finally {
      clearTimeout(timer);
    }
  };

  await pace();
  const tones = buildToneIndex(await bounded(client.getColors()));
  await pace();
  const stockList = await bounded(client.getStockList());
  const stock = buildStockIndex(stockList.products);

  const products: InnovationProduct[] = [];
  let rejected = 0;
  await pace();
  const first = await bounded(client.getProductsPage(1));
  if (first.totalPages > MAX_PAGES) throw new SyncAbort('too_many_pages');
  const pages = first.totalPages;
  products.push(...first.products);
  rejected += first.rejected;
  for (let page = 2; page <= pages; page++) {
    if (first.products.length + first.rejected < PAGE_SIZE) throw new SyncAbort('short_page');
    await pace();
    const next = await bounded(client.getProductsPage(page));
    if (next.totalPages !== pages) throw new SyncAbort('inconsistent_pages');
    if (page < pages && next.products.length + next.rejected < PAGE_SIZE) throw new SyncAbort('short_page');
    products.push(...next.products);
    rejected += next.rejected;
  }
  return { products, rejected, tones, stock };
}
