import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { availabilityOf, isStale, publicPrice, toCard, toDetail, type PublicDetailRow } from '../public';

const SENTINEL = 'PRECIO-SENTINEL-98765';
const row = {
  code: 'TH-239',
  name: 'Audífonos',
  category: 'Tecnología',
  subcategory: null,
  image: null,
  totalStock: 250,
  description: 'd',
  images: [],
  specs: { material: null, size: null, weight: null, printTechnique: null, printArea: null, packQty: null },
  variants: [
    { code: 'TH-239A', tone: 'AZUL', hex: '#006CBA', image: null, stock: 250 },
    { code: 'TH-239R', tone: 'ROJO', hex: null, image: null, stock: 0 },
  ],
  costCents: 999999,
  Precio: SENTINEL,
  UniqueID: 'u-1',
  provider: 'innovation',
} as PublicDetailRow;

describe('public mapping', () => {
  it('has price null and leaks no cost, id, provider, raw keys or stock numbers (DoD-4, DoD-5)', () => {
    const json = JSON.stringify([toCard(row, false), toDetail(row, false)]);
    expect(publicPrice()).toBeNull();
    for (const needle of [SENTINEL, '999999', 'costCents', 'cost_cents', 'UniqueID', 'uniqueId', 'provider', 'innovation', 'Codigo', 'Nombre', 'Variantes', '"stock"', 'totalStock', '250']) {
      expect(json).not.toContain(needle);
    }
    expect(toCard(row, false).price).toBeNull();
  });

  it('maps availability coarsely and marks old snapshots unknown', () => {
    expect(availabilityOf(250, false)).toBe('available');
    expect(availabilityOf(99, false)).toBe('low');
    expect(availabilityOf(0, false)).toBe('out');
    expect(availabilityOf(null, false)).toBe('unknown');
    expect(availabilityOf(250, true)).toBe('unknown');
    const now = new Date('2026-10-26T12:00:00Z');
    expect(isStale(new Date('2026-10-18T12:00:00Z'), now)).toBe(true);
    expect(isStale(new Date('2026-10-25T12:00:00Z'), now)).toBe(false);
    expect(isStale(null, now)).toBe(true);
    expect(toDetail(row, false).variants.map((v) => v.availability)).toEqual(['available', 'out']);
  });
});

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !p.includes('__tests__')) out.push(p);
  }
  return out;
}
const root = join(process.cwd(), 'src');

describe('static guarantees', () => {
  it('public reads never select the cost column (DoD-4)', () => {
    for (const f of ['server/catalog/queries.ts', ...walk(join(root, 'app/api/catalog')).map((p) => p.slice(root.length + 1))]) {
      expect(readFileSync(join(root, f), 'utf8')).not.toMatch(/costCents|cost_cents/);
    }
  });

  it('no per-visitor supplier calls: public code never imports the integrations layer (DoD-8)', () => {
    const files = [
      ...walk(join(root, 'app/api/catalog')),
      ...walk(join(root, 'components')),
      join(root, 'server/catalog/queries.ts'),
      join(root, 'server/catalog/public.ts'),
      join(root, 'server/catalog/service.ts'),
    ];
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/@\/server\/integrations/);
  });

  it('no direct fetch( call in src/server: outbound HTTP goes through the http-client (DoD-7)', () => {
    const hits = walk(join(root, 'server')).filter((f) => /\bfetch\(/.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});
