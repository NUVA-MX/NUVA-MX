import { describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@/server/integrations';
import type { InnovationClient } from '@/server/integrations';
import type { AuditEvent } from '@/server/audit/audit';
import { runCatalogSync, shrinkGuardAllows, type SyncDeps } from '../sync';
import type { NormalizedProduct, StartResult, SyncStore, SyncTrigger } from '../types';
import { codes, product, stockRow } from './fixtures';

const INSIDE = new Date('2026-10-26T15:30:00Z');
const OUTSIDE = new Date('2026-10-26T20:30:00Z');

class FakeStore implements SyncStore {
  running: { id: string; startedAt: Date } | null = null;
  products = new Map<string, { active: boolean; runId: string }>();
  runs: { id: string; status: string; errorKind?: string; accepted?: number }[] = [];
  private n = 0;
  constructor(initial: string[] = []) {
    for (const c of initial) this.products.set(c, { active: true, runId: 'old' });
  }
  async startRun(_t: SyncTrigger, now: Date): Promise<StartResult> {
    if (this.running && now.getTime() - this.running.startedAt.getTime() > 10 * 60 * 1000) {
      this.runs.find((r) => r.id === this.running?.id)!.status = 'failed';
      this.running = null;
    }
    if (this.running) return { blocked: 'running' as const };
    const id = `run-${++this.n}`;
    this.running = { id, startedAt: now };
    this.runs.push({ id, status: 'running' });
    return { runId: id };
  }
  async activeCount() {
    return [...this.products.values()].filter((p) => p.active).length;
  }
  async upsertProducts(runId: string, rows: readonly NormalizedProduct[]) {
    for (const r of rows) this.products.set(r.code, { active: true, runId });
  }
  async completeRun(runId: string, s: { accepted: number }) {
    let gone = 0;
    for (const p of this.products.values()) {
      if (p.active && p.runId !== runId) {
        p.active = false;
        gone++;
      }
    }
    Object.assign(this.runs.find((r) => r.id === runId)!, { status: 'success', accepted: s.accepted });
    this.running = null;
    return gone;
  }
  async failRun(runId: string, _s: unknown, errorKind: string) {
    Object.assign(this.runs.find((r) => r.id === runId)!, { status: 'failed', errorKind });
    this.running = null;
  }
}

function clientFor(count: number, over: Partial<InnovationClient> = {}): InnovationClient {
  const list = codes(count).map((c) => product(c));
  return {
    getColors: vi.fn(async () => ({ tones: [{ name: 'AZUL', rgb: '#006CBA' }] })),
    getStockList: vi.fn(async () => ({ products: [stockRow('AA-000', '5')], rejected: 0 })),
    getProductsPage: vi.fn(async (page: number) => ({ page, totalPages: 1, products: list, rejected: 0 })),
    ...over,
  };
}

function depsFor(store: FakeStore | null, client: InnovationClient | null, over: Partial<SyncDeps> = {}) {
  const audits: AuditEvent[] = [];
  const deps: SyncDeps = {
    store,
    client,
    now: () => INSIDE,
    sleep: async () => {},
    audit: async (e) => void audits.push(e),
    ignoreWindow: false,
    minAccepted: 100,
    budgetMs: 50_000,
    ...over,
  };
  return { deps, audits };
}

describe('runCatalogSync', () => {
  it('syncs inside the window, deactivates unseen rows, audits counts only', async () => {
    const store = new FakeStore(['OLD-1', ...codes(119)]);
    const { deps, audits } = depsFor(store, clientFor(120));
    const r = await runCatalogSync('cron', { type: 'system' }, deps);
    expect(r).toMatchObject({ status: 'success', accepted: 120, rejected: 0, deactivated: 1 });
    expect(store.products.get('OLD-1')?.active).toBe(false);
    expect(audits[0]).toMatchObject({ action: 'catalog.sync', outcome: 'success' });
  });

  it('returns outside_window with zero supplier calls (DoD-10)', async () => {
    const client = clientFor(120);
    const { deps } = depsFor(new FakeStore(), client, { now: () => OUTSIDE });
    expect((await runCatalogSync('cron', { type: 'system' }, deps)).status).toBe('outside_window');
    expect(client.getColors).not.toHaveBeenCalled();
    const ignored = depsFor(new FakeStore(), client, { now: () => OUTSIDE, ignoreWindow: true });
    expect((await runCatalogSync('cron', { type: 'system' }, ignored.deps)).status).toBe('success');
  });

  it('is not_configured without a client or store', async () => {
    expect((await runCatalogSync('cron', { type: 'system' }, depsFor(new FakeStore(), null).deps)).status).toBe('not_configured');
    expect((await runCatalogSync('cron', { type: 'system' }, depsFor(null, clientFor(1)).deps)).status).toBe('not_configured');
  });

  it('runs one sync at a time and recovers a stale lock (DoD-11, fake store)', async () => {
    const store = new FakeStore();
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const slow = clientFor(120, { getColors: async () => (await gate, { tones: [] }) });
    const first = runCatalogSync('cron', { type: 'system' }, depsFor(store, slow).deps);
    await Promise.resolve();
    await Promise.resolve();
    const second = await runCatalogSync('admin', { type: 'admin' }, depsFor(store, clientFor(120)).deps);
    expect(second.status).toBe('skipped');
    release();
    expect((await first).status).toBe('success');

    store.running = { id: 'run-1', startedAt: new Date(INSIDE.getTime() - 11 * 60 * 1000) };
    const later = await runCatalogSync('cron', { type: 'system' }, depsFor(store, clientFor(120)).deps);
    expect(later.status).toBe('success');
  });

  it.each([
    ['auth', new IntegrationError('auth', 'x')],
    ['parse', new IntegrationError('parse', 'x')],
    ['timeout', new IntegrationError('timeout', 'x')],
    ['too_large', new IntegrationError('too_large', 'x')],
  ])('an envelope failure (%s) fails the run and keeps the old rows (DoD-13)', async (kind, error) => {
    const store = new FakeStore(codes(150));
    const client = clientFor(120, { getProductsPage: async () => Promise.reject(error) });
    const { deps, audits } = depsFor(store, client);
    const r = await runCatalogSync('cron', { type: 'system' }, deps);
    expect(r).toMatchObject({ status: 'failed', errorKind: kind });
    expect([...store.products.values()].every((p) => p.active && p.runId === 'old')).toBe(true);
    expect(audits[0]).toMatchObject({ outcome: 'failure', metadata: { errorKind: kind } });
    expect(JSON.stringify(audits)).not.toMatch(/Producto|http/);
  });

  it('shrink guard: a snapshot under 80% of the previous one changes nothing (DoD-14)', async () => {
    const store = new FakeStore(codes(200));
    const { deps } = depsFor(store, clientFor(120));
    const r = await runCatalogSync('cron', { type: 'system' }, deps);
    expect(r).toMatchObject({ status: 'failed', errorKind: 'shrink_guard' });
    expect([...store.products.values()].filter((p) => p.active)).toHaveLength(200);
    expect(shrinkGuardAllows(160, 200, 100)).toBe(true);
    expect(shrinkGuardAllows(159, 200, 100)).toBe(false);
    expect(shrinkGuardAllows(99, 0, 100)).toBe(false);
  });

  it('an empty result fails and too many pages fail', async () => {
    const empty = clientFor(0, { getProductsPage: async (page) => ({ page, totalPages: 1, products: [], rejected: 0 }) });
    expect(await runCatalogSync('cron', { type: 'system' }, depsFor(new FakeStore(), empty).deps)).toMatchObject({ errorKind: 'empty' });
    const many = clientFor(120, { getProductsPage: async (page) => ({ page, totalPages: 999, products: [], rejected: 0 }) });
    expect(await runCatalogSync('cron', { type: 'system' }, depsFor(new FakeStore(), many).deps)).toMatchObject({ errorKind: 'too_many_pages' });
  });

  it('stops when the time budget is spent', async () => {
    let t = 0;
    const multi = clientFor(120, { getProductsPage: async (page) => ({ page, totalPages: 5, products: codes(30, `P${page}-`).map((c) => product(c)), rejected: 0 }) });
    const { deps } = depsFor(new FakeStore(), multi, { now: () => new Date(INSIDE.getTime() + t), sleep: async (ms) => void (t += ms * 20), budgetMs: 5_000 });
    expect(await runCatalogSync('cron', { type: 'system' }, deps)).toMatchObject({ status: 'failed', errorKind: 'budget' });
  });

  it('counts supplier rows that fail normalization as rejected', async () => {
    const list = [...codes(120).map((c) => product(c)), product('x', { Codigo: undefined }), product('y', { ImagenP: '//evil.example/x.jpg' })];
    const client = clientFor(0, { getProductsPage: async (page) => ({ page, totalPages: 1, products: list, rejected: 1 }) });
    const r = await runCatalogSync('cron', { type: 'system' }, depsFor(new FakeStore(), client).deps);
    expect(r).toMatchObject({ status: 'success', accepted: 121, rejected: 2 });
  });

  it('reports a cooldown from the store without calling the supplier (S5)', async () => {
    const store = new FakeStore();
    store.startRun = async () => ({ blocked: 'cooldown' });
    const client = clientFor(120);
    expect((await runCatalogSync('admin', { type: 'admin' }, depsFor(store, client).deps)).status).toBe('cooldown');
    expect(client.getColors).not.toHaveBeenCalled();
  });

  it('ends the run itself when a supplier call outlives the budget, and releases the lock (S4)', async () => {
    const store = new FakeStore();
    const hang = clientFor(120, { getStockList: () => new Promise(() => {}) });
    const r = await runCatalogSync('cron', { type: 'system' }, depsFor(store, hang, { budgetMs: 30 }).deps);
    expect(r).toMatchObject({ status: 'failed', errorKind: 'budget' });
    expect(store.running).toBeNull();
    expect(store.runs[0].status).toBe('failed');
  });

  it('aborts when the supplier window closes mid-run (S4)', async () => {
    let calls = 0;
    const clock = () => (calls++ < 3 ? INSIDE : OUTSIDE);
    const multi = clientFor(120, { getProductsPage: async (page) => ({ page, totalPages: 2, products: codes(100, `Q${page}-`).map((c) => product(c)), rejected: 0 }) });
    const r = await runCatalogSync('cron', { type: 'system' }, depsFor(new FakeStore(), multi, { now: clock, budgetMs: 1e12 }).deps);
    expect(r).toMatchObject({ status: 'failed', errorKind: 'window_closed' });
  });

  it('fails on a short non-last page or inconsistent page totals (S3)', async () => {
    const short = clientFor(120, { getProductsPage: async (page) => ({ page, totalPages: 2, products: codes(40, `S${page}-`).map((c) => product(c)), rejected: 0 }) });
    expect(await runCatalogSync('cron', { type: 'system' }, depsFor(new FakeStore(), short).deps)).toMatchObject({ errorKind: 'short_page' });
    const odd = clientFor(120, { getProductsPage: async (page) => ({ page, totalPages: page === 1 ? 2 : 3, products: codes(100, `T${page}-`).map((c) => product(c)), rejected: 0 }) });
    expect(await runCatalogSync('cron', { type: 'system' }, depsFor(new FakeStore(), odd).deps)).toMatchObject({ errorKind: 'inconsistent_pages' });
  });

  describe('timing with real supplier latencies (S13)', () => {
    function timed(latency: { colors: number; stock: number; page: number }) {
      let t = 0;
      const advance = (ms: number) => void (t += ms);
      const client: InnovationClient = {
        getColors: async () => (advance(latency.colors), { tones: [] }),
        getStockList: async () => (advance(latency.stock), { products: [stockRow('AA-000', '5')], rejected: 0 }),
        getProductsPage: async (page) => (advance(latency.page), { page, totalPages: 15, products: codes(100, `R${page}-`).map((c) => product(c)), rejected: 0 }),
      };
      return { client, now: () => new Date(INSIDE.getTime() + t), sleep: async (ms: number) => advance(ms), elapsed: () => t };
    }

    it('a full run at the measured latencies (1 s, 7.6 s, 15 pages x 2 s) fits the 52 s budget with slack', async () => {
      const f = timed({ colors: 1000, stock: 7600, page: 2000 });
      const store = new FakeStore();
      const { deps } = depsFor(store, f.client, { now: f.now, sleep: f.sleep, budgetMs: 52_000, minAccepted: 100 });
      const r = await runCatalogSync('cron', { type: 'system' }, deps);
      expect(r).toMatchObject({ status: 'success', accepted: 1500 });
      expect(f.elapsed()).toBeLessThan(40_000);
      expect(f.elapsed()).toBeLessThan(52_000 * 0.8);
    });

    it('call starts stay at least 1.1 s apart even for fast calls', async () => {
      const f = timed({ colors: 100, stock: 100, page: 100 });
      const starts: number[] = [];
      const orig = f.client.getProductsPage;
      f.client.getProductsPage = async (page) => (starts.push(f.elapsed()), orig(page));
      const { deps } = depsFor(new FakeStore(), f.client, { now: f.now, sleep: f.sleep, budgetMs: 52_000 });
      await runCatalogSync('cron', { type: 'system' }, deps);
      for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(1100);
    });

    it('a much slower supplier fails cleanly with budget and releases the lock', async () => {
      const f = timed({ colors: 2000, stock: 15_000, page: 4000 });
      const store = new FakeStore();
      const { deps } = depsFor(store, f.client, { now: f.now, sleep: f.sleep, budgetMs: 52_000 });
      expect(await runCatalogSync('cron', { type: 'system' }, deps)).toMatchObject({ status: 'failed', errorKind: 'budget' });
      expect(store.running).toBeNull();
      expect(store.runs[0].status).toBe('failed');
    });
  });
});
