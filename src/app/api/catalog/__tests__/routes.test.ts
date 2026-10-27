import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetEnvCache } from '@/server/env';
import { resetRateLimitGuard } from '@/server/ratelimit/guard';

const m = vi.hoisted(() => ({ listProducts: vi.fn(), getProductByCode: vi.fn(), listCategoryCounts: vi.fn(), lastSuccessfulSyncAt: vi.fn() }));
vi.mock('@/server/catalog/queries', () => m);

import { GET as list } from '../route';
import { GET as categories } from '../categories/route';
import { GET as item } from '../items/[code]/route';

const SENTINEL = 'PRECIO-SENTINEL-98765';
const get = (path: string, ip = '8.8.8.8') => new Request(`https://nuva.test${path}`, { headers: { 'x-real-ip': ip } });
const ctx = (code: string) => ({ params: Promise.resolve({ code }) });
const dbRow = {
  code: 'TH-239',
  name: 'Audífonos',
  category: 'Tecnología',
  subcategory: 'Audífonos',
  image: null,
  totalStock: 54321,
  variants: [{ code: 'TH-239A', tone: 'AZUL', hex: '#006CBA', image: null, stock: 54321 }],
  costCents: 7654321,
  Precio: SENTINEL,
  UniqueID: 'u-1',
  description: 'd',
  images: [],
  specs: { material: null, size: null, weight: null, printTechnique: null, printArea: null, packQty: null },
};

describe('public catalog routes', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@localhost/db');
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true');
    resetEnvCache();
    resetRateLimitGuard();
    m.listProducts.mockResolvedValue({ rows: [dbRow], total: 1 });
    m.getProductByCode.mockResolvedValue(dbRow);
    m.listCategoryCounts.mockResolvedValue([{ category: 'Tecnología', subcategory: 'Audífonos', n: 1 }]);
    m.lastSuccessfulSyncAt.mockResolvedValue(new Date());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    resetEnvCache();
    resetRateLimitGuard();
  });

  it('serves the stored snapshot with price null and no cost or supplier keys (DoD-4, DoD-5)', async () => {
    const bodies = await Promise.all([list(get('/api/catalog')), categories(get('/api/catalog/categories')), item(get('/api/catalog/items/TH-239'), ctx('TH-239'))].map(async (p) => (await p).text()));
    for (const text of bodies) {
      for (const needle of [SENTINEL, '54321', '7654321', 'costCents', 'totalStock', '"stock"', 'UniqueID', 'provider', 'innovation', 'Codigo']) expect(text).not.toContain(needle);
    }
    const body = JSON.parse(bodies[0]);
    expect(body).toMatchObject({ enabled: true, total: 1, page: 1, pageSize: 24 });
    expect(body.items[0]).toMatchObject({ code: 'TH-239', price: null, availability: 'available' });
    expect(JSON.parse(bodies[2]).product.variants[0]).toMatchObject({ code: 'TH-239A', availability: 'available' });
    expect((await list(get('/api/catalog'))).headers.get('cache-control')).toBe('no-store');
  });

  it('prices ON: price is the derived value, never the cost, in list and detail; categories carry none', async () => {
    vi.stubEnv('INTEGRATION_INNOVATION_SHOW_PRICES', 'true');
    resetEnvCache();
    const derived = Math.round(7654321 * 1.17) / 100;
    const [l, c, d] = await Promise.all([list(get('/api/catalog')), categories(get('/api/catalog/categories')), item(get('/api/catalog/items/TH-239'), ctx('TH-239'))]);
    const texts = [await l.text(), await c.text(), await d.text()];
    expect(JSON.parse(texts[0]).items[0].price).toBe(derived);
    expect(JSON.parse(texts[2]).product.price).toBe(derived);
    expect(derived).not.toBe(7654321 / 100);
    for (const text of texts) {
      for (const needle of [SENTINEL, '7654321', '76543.21', 'costCents', 'cost_cents', '54321']) expect(text).not.toContain(needle);
    }
  });

  it('a custom PRICE_FACTOR changes the derived price; SHOW_PRICES off keeps null', async () => {
    vi.stubEnv('INTEGRATION_INNOVATION_SHOW_PRICES', 'true');
    vi.stubEnv('INTEGRATION_INNOVATION_PRICE_FACTOR', '2');
    resetEnvCache();
    expect((await (await list(get('/api/catalog'))).json()).items[0].price).toBe(Math.round(7654321 * 2) / 100);
    vi.stubEnv('INTEGRATION_INNOVATION_SHOW_PRICES', 'false');
    resetEnvCache();
    expect((await (await list(get('/api/catalog'))).json()).items[0].price).toBeNull();
  });

  it('still serves the snapshot when the supplier integration is disabled (DoD-15)', async () => {
    vi.stubEnv('INTEGRATION_INNOVATION_ENABLED', 'false');
    resetEnvCache();
    expect((await list(get('/api/catalog'))).status).toBe(200);
  });

  it.each([
    ['q too long', `q=${'a'.repeat(61)}`],
    ['pageSize 1000', 'pageSize=1000'],
    ['page 0', 'page=0'],
    ['category too long', `category=${'a'.repeat(81)}`],
    ['page not a number', 'page=abc'],
  ])('rejects %s with 400 (DoD-16)', async (_n, qs) => {
    const res = await list(get(`/api/catalog?${qs}`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
    expect(m.listProducts).not.toHaveBeenCalled();
  });

  it('passes wildcard characters through as literal search text', async () => {
    await list(get('/api/catalog?q=%25'));
    expect(m.listProducts).toHaveBeenCalledWith(expect.objectContaining({ q: '%' }));
  });

  it.each(['..%2F..', 'th-239', 'A'.repeat(31), '%00', 'TH 239'])('item code %s is a 404 without a query', async (code) => {
    const res = await item(get('/api/catalog/items/x'), ctx(decodeURIComponent(code)));
    expect(res.status).toBe(404);
    expect(m.getProductByCode).not.toHaveBeenCalled();
  });

  it('unknown or inactive code is 404', async () => {
    m.getProductByCode.mockResolvedValue(null);
    const res = await item(get('/api/catalog/items/ZZ-1'), ctx('ZZ-1'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });

  it('the 121st request per minute and IP is 429 with Retry-After (DoD-17)', async () => {
    for (let i = 0; i < 120; i++) expect((await categories(get('/api/catalog/categories', '9.9.9.9'))).status).toBe(200);
    const res = await categories(get('/api/catalog/categories', '9.9.9.9'));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
    expect((await categories(get('/api/catalog/categories', '9.9.9.10'))).status).toBe(200);
  });

  it('a store failure is a generic 500', async () => {
    m.listProducts.mockRejectedValue(new Error('relation "supplier_products" does not exist'));
    const res = await list(get('/api/catalog'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'server_error' });
  });

  it('CATALOG_PUBLIC=false answers enabled:false; NUVA_SAMPLE_DATA=empty|error give those states (DoD-19)', async () => {
    vi.stubEnv('INTEGRATION_INNOVATION_CATALOG_PUBLIC', 'false');
    resetEnvCache();
    expect(await (await list(get('/api/catalog'))).json()).toMatchObject({ enabled: false, items: [] });
    expect(await (await categories(get('/api/catalog/categories'))).json()).toEqual({ enabled: false, categories: [] });
    vi.stubEnv('INTEGRATION_INNOVATION_CATALOG_PUBLIC', 'true');
    vi.stubEnv('NUVA_SAMPLE_DATA', 'empty');
    resetEnvCache();
    expect(await (await list(get('/api/catalog'))).json()).toMatchObject({ enabled: true, items: [], total: 0 });
    vi.stubEnv('NUVA_SAMPLE_DATA', 'error');
    resetEnvCache();
    expect((await list(get('/api/catalog'))).status).toBe(500);
  });

  it('without a database: sample data in development, disabled in production (DoD-19)', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('NODE_ENV', 'development');
    resetEnvCache();
    const dev = await (await list(get('/api/catalog?q=audifonos'))).json();
    expect(dev.enabled).toBe(true);
    expect(dev.items[0].code).toBe('TH-239');
    expect(JSON.stringify(dev)).not.toMatch(/https?:/);
    vi.stubEnv('NODE_ENV', 'production');
    resetEnvCache();
    expect(await (await list(get('/api/catalog'))).json()).toMatchObject({ enabled: false });
    expect(m.listProducts).not.toHaveBeenCalled();
  });

  it('NUVA_SAMPLE_DATA=sample previews fake items even with a database, but only outside production', async () => {
    vi.stubEnv('NUVA_SAMPLE_DATA', 'sample');
    vi.stubEnv('NODE_ENV', 'development');
    resetEnvCache();
    const dev = await (await list(get('/api/catalog?q=audifonos'))).json();
    expect(dev.items[0].code).toBe('TH-239');
    expect(m.listProducts).not.toHaveBeenCalled();
    vi.stubEnv('NODE_ENV', 'production');
    resetEnvCache();
    await list(get('/api/catalog'));
    expect(m.listProducts).toHaveBeenCalled();
  });
});
