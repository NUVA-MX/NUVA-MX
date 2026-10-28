import { describe, expect, it } from 'vitest';
import { buildCatalogSearch, countActiveFilters, NO_FILTERS, parseCatalogUrl, prepareCategories } from '../url';

describe('parseCatalogUrl', () => {
  it('returns defaults for an empty query', () => {
    expect(parseCatalogUrl('')).toEqual({ filters: NO_FILTERS, page: 1 });
  });

  it('reads every param', () => {
    const state = parseCatalogUrl('?q=taza&cat=Bebidas&sub=Termos&sort=price_desc&pagina=3');
    expect(state).toEqual({ filters: { q: 'taza', category: 'Bebidas', subcategory: 'Termos', sort: 'price_desc' }, page: 3 });
  });

  it('falls back on invalid values', () => {
    const state = parseCatalogUrl('?sort=newest&pagina=-4&q=%20%20');
    expect(state.filters.sort).toBe('name');
    expect(state.filters.q).toBe('');
    expect(state.page).toBe(1);
  });

  it('accepts the Z–A name sort', () => {
    expect(parseCatalogUrl('?sort=name_desc').filters.sort).toBe('name_desc');
  });

  it('ignores sub without cat and caps long text', () => {
    expect(parseCatalogUrl('?sub=Termos').filters.subcategory).toBe('');
    expect(parseCatalogUrl(`?q=${'a'.repeat(200)}`).filters.q).toHaveLength(60);
  });
});

describe('buildCatalogSearch', () => {
  it('omits empty and default values', () => {
    expect(buildCatalogSearch('', { filters: NO_FILTERS, page: 1 })).toBe('');
  });

  it('round trips a full state', () => {
    const state = { filters: { q: 'taza azul', category: 'Bebidas', subcategory: 'Termos', sort: 'price_asc' as const }, page: 2 };
    expect(parseCatalogUrl(buildCatalogSearch('', state))).toEqual(state);
  });

  it('keeps unrelated params and drops cleared ones', () => {
    const out = buildCatalogSearch('?utm=x&cat=A&pagina=4', { filters: NO_FILTERS, page: 1 });
    expect(out).toBe('?utm=x');
  });

  it('does not write sub without a category', () => {
    const state = { filters: { ...NO_FILTERS, subcategory: 'Termos' }, page: 1 };
    expect(buildCatalogSearch('', state)).toBe('');
  });
});

describe('countActiveFilters', () => {
  it('counts search, category and subcategory but not sort', () => {
    expect(countActiveFilters({ q: 'x', category: 'A', subcategory: 'B', sort: 'price_asc' })).toBe(3);
    expect(countActiveFilters({ ...NO_FILTERS, sort: 'price_asc' })).toBe(0);
  });
});

describe('prepareCategories', () => {
  it('hides empty categories, sorts in Spanish order and sums the total', () => {
    const { rows, total } = prepareCategories([
      { name: 'Oficina', count: 5, subcategories: ['Útiles', 'Agendas'] },
      { name: 'Ñandú', count: 0, subcategories: [] },
      { name: 'Bebidas', count: 7, subcategories: [] },
      { name: 'Álbum', count: 1, subcategories: [] },
    ]);
    expect(rows.map((r) => r.name)).toEqual(['Álbum', 'Bebidas', 'Oficina']);
    expect(rows[2].subcategories).toEqual(['Agendas', 'Útiles']);
    expect(total).toBe(13);
  });
});
