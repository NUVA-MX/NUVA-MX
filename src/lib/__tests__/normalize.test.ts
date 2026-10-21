import { describe, expect, it } from 'vitest';
import { normalize, normalizeList } from '../products/normalize';
import { sampleProducts } from '../products/sample';

describe('normalize', () => {
  it('llena con null los campos que faltan', () => {
    expect(normalize({ id: 'x', name: 'Gorra' })).toEqual({
      id: 'x',
      name: 'Gorra',
      meta: null,
      price: null,
      stock: null,
      image: null,
      imageAlt: null,
      category: null,
    });
  });
  it('convierte números en texto y descarta negativos', () => {
    const p = normalize({ id: 1, name: 'A', price: '390', stock: -2 });
    expect(p?.id).toBe('1');
    expect(p?.price).toBe(390);
    expect(p?.stock).toBeNull();
  });
  it('descarta objetos sin id o nombre', () => {
    expect(normalize({ name: 'A' })).toBeNull();
    expect(normalize({ id: 'a', name: '  ' })).toBeNull();
    expect(normalize(null)).toBeNull();
  });
  it('no deja pasar campos extra como visible', () => {
    expect(normalize({ id: 'a', name: 'A', visible: false })).not.toHaveProperty('visible');
  });
  it('normalizeList filtra inválidos y tolera no-arreglos', () => {
    expect(normalizeList([{ id: 'a', name: 'A' }, { foo: 1 }])).toHaveLength(1);
    expect(normalizeList('x')).toEqual([]);
  });
  it('los datos de muestra ya vienen normalizados', () => {
    expect(normalizeList(sampleProducts)).toEqual(sampleProducts);
    expect(sampleProducts).toHaveLength(8);
  });
});
