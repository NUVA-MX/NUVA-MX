import { describe, expect, it } from 'vitest';
import { buildStockIndex, buildToneIndex, normalizeProducts } from '../normalize';
import { cleanHex, cleanText, toCostCents } from '../sanitize';
import { escapeLike, likePatterns, searchKey } from '../search';
import { IMG, product, stockRow } from './fixtures';

const tones = buildToneIndex({ tones: [{ name: 'AZUL', rgb: ' #006CBA' }, { name: 'ROJO', rgb: 'red;background:url(x)' }] });
const stock = buildStockIndex([stockRow('TH-239', '250', { 'TH-239A': '250', 'TH-239R': '0' })]);

describe('normalizeProducts', () => {
  it('stores good rows with hex, stock and cost, and counts the bad ones (DoD-12)', () => {
    const rows = [
      product('TH-239'),
      product('', { Codigo: undefined }),
      product('TH-300', { ImagenP: 'javascript:alert(1)', ImagenesC: ['//evil.example/x.jpg', IMG('ok')] }),
      product('TH-301', { Variantes: [{ 'Codigo Variante': 'TH-301X', Tono: 'ROJO', Imagen: undefined }] }),
      product('TH-302', { Descripcion: 'd'.repeat(5000) }),
      product('TH-239'),
    ];
    const r = normalizeProducts(rows, tones, stock);
    expect(r.rejected).toBe(2);
    expect(r.reasons).toEqual({ invalid_code: 1, duplicate_code: 1 });
    expect(r.rows.map((x) => x.code)).toEqual(['TH-239', 'TH-300', 'TH-301', 'TH-302']);
    const [a, b, c, d] = r.rows;
    expect(a.variants[0]).toMatchObject({ code: 'TH-239A', hex: '#006CBA', stock: 250 });
    expect(a.totalStock).toBe(250);
    expect(a.costCents).toBe(1345);
    expect(b.image).toBeNull();
    expect(b.images).toEqual([IMG('ok')]);
    expect(c.variants[0].hex).toBeNull();
    expect(d.description).toHaveLength(2000);
  });

  it('caps variants at 40, images at 8, and strips control characters', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ 'Codigo Variante': `ZZ-1V${i}`, Tono: 'AZUL', Imagen: undefined }));
    const r = normalizeProducts(
      [product('ZZ-1', { Variantes: many, ImagenesC: Array.from({ length: 12 }, (_, i) => IMG(`i${i}`)), Nombre: 'Taza\u0000‮  grande\n' })],
      tones,
      stock,
    );
    expect(r.rows[0].variants).toHaveLength(40);
    expect(r.rows[0].images).toHaveLength(8);
    expect(r.rows[0].name).toBe('Taza grande');
  });

  it('strips lone surrogates and NUL everywhere so one row cannot break the upsert (S2)', () => {
    const lone = '\ud83d';
    const r = normalizeProducts(
      [
        product('SU-1', {
          Nombre: `Taza${lone}\u0000x`,
          Descripcion: `desc${lone}\udc00`,
          Materiales: [`Acero${lone}`],
          Variantes: [{ 'Codigo Variante': 'SU-1A', Tono: `AZUL${lone}`, Imagen: undefined }],
        }),
        product('SU-2', { Nombre: `${'a'.repeat(199)}😀` }),
      ],
      tones,
      stock,
    );
    const json = JSON.stringify(r.rows);
    expect(json).not.toMatch(/\\ud[89a-f]/i);
    expect(json).not.toContain('\\u0000');
    expect(r.rows[0].name).toBe('Taza x');
    expect(r.rows[0].variants[0].tone).toBe('AZUL');
    expect(r.rows[1].name).toBe(`${'a'.repeat(199)}😀`);
    expect(() => encodeURIComponent(r.rows[0].description ?? '')).not.toThrow();
  });

  it('builds accent-free search text', () => {
    const r = normalizeProducts([product('TH-9', { Nombre: 'Audífonos Pavona' })], tones, stock);
    expect(r.rows[0].searchText).toContain('audifonos pavona');
  });
});

describe('sanitizers and search helpers', () => {
  it('hex and cost', () => {
    expect(cleanHex(' #00b445 ')).toBe('#00B445');
    expect(cleanHex('red;background:url(x)')).toBeNull();
    expect(cleanHex('#fff')).toBeNull();
    expect(toCostCents('13.45')).toBe(1345);
    expect(toCostCents('-1')).toBeNull();
    expect(toCostCents('abc')).toBeNull();
    expect(cleanText('   ', 10)).toBeNull();
  });
  it('escapes LIKE wildcards (DoD-16)', () => {
    expect(escapeLike('100%_\\')).toBe('100\\%\\_\\\\');
    expect(likePatterns('%')).toEqual(['%\\%%']);
    expect(likePatterns('_')).toEqual(['%\\_%']);
    expect(searchKey('  ÁÉÍ  Ñu ')).toBe('aei nu');
    expect(likePatterns('a b c d e f g')).toHaveLength(5);
  });
});
