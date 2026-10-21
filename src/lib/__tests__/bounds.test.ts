import { describe, expect, it } from 'vitest';
import { blobPublicHost, isSafeUploadPath } from '../blob';
import { cartReducer, initialCart, sanitizeCart } from '../cart/reducer';
import { MAX_DB_INT, PRODUCT_LIMITS, isAllowedImageUrl, readProductForm } from '../products/validation';

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe('product form bounds (never above the DB integer)', () => {
  it.each(['price', 'stock', 'sortOrder'])('%s rejects values above the DB integer', (field) => {
    expect(readProductForm(form({ name: 'X', [field]: '99999999999' })).success).toBe(false);
    expect(readProductForm(form({ name: 'X', [field]: String(MAX_DB_INT + 1) })).success).toBe(false);
    expect(readProductForm(form({ name: 'X', [field]: '1'.repeat(40) })).success).toBe(false);
  });
  it('accepts values at the business limit and rejects one above', () => {
    expect(readProductForm(form({ name: 'X', price: String(PRODUCT_LIMITS.price) })).success).toBe(true);
    expect(readProductForm(form({ name: 'X', price: String(PRODUCT_LIMITS.price + 1) })).success).toBe(false);
    expect(readProductForm(form({ name: 'X', stock: String(PRODUCT_LIMITS.stock + 1) })).success).toBe(false);
    expect(readProductForm(form({ name: 'X', sortOrder: String(PRODUCT_LIMITS.sortOrder + 1) })).success).toBe(false);
  });
  it('limits are below the DB integer', () => {
    for (const v of Object.values(PRODUCT_LIMITS)) expect(v).toBeLessThan(MAX_DB_INT);
  });
});

describe('Blob store restriction', () => {
  it('derives the public host from the read-write token', () => {
    expect(blobPublicHost('vercel_blob_rw_AbC123xyz_secretPart')).toBe('abc123xyz.public.blob.vercel-storage.com');
  });
  it('returns null for missing or malformed tokens', () => {
    expect(blobPublicHost(undefined)).toBeNull();
    expect(blobPublicHost('nope')).toBeNull();
    expect(blobPublicHost('vercel_blob_rw__x')).toBeNull();
  });
  it('with a store host, only that store is accepted', () => {
    const host = 'abc123xyz.public.blob.vercel-storage.com';
    expect(isAllowedImageUrl(`https://${host}/productos/a-x1.jpg`, host)).toBe(true);
    expect(isAllowedImageUrl('https://someoneelse.public.blob.vercel-storage.com/a.png', host)).toBe(false);
    expect(readProductForm(form({ name: 'X', imageUrl: 'https://someoneelse.public.blob.vercel-storage.com/a.png' }), { imageHost: host }).success).toBe(false);
  });
});

describe('isSafeUploadPath', () => {
  it.each(['productos/gorra.jpg', 'productos/foto-1.webp'])('accepts %s', (p) => expect(isSafeUploadPath(p)).toBe(true));
  it.each(['../../etc/passwd', 'productos/../x.jpg', 'productos/.hidden', 'otros/a.jpg', 'productos/A.JPG', 'productos/a/b.jpg', 'productos/'])(
    'rejects %s',
    (p) => expect(isSafeUploadPath(p)).toBe(false),
  );
});

describe('sanitizeCart bounds', () => {
  const ok = { id: 'a', name: 'A', price: 100, stock: 5, qty: 2 };
  it('drops negative, fractional or huge prices and bad stock', () => {
    expect(sanitizeCart({ items: [{ ...ok, price: -100000 }] }).items).toEqual([]);
    expect(sanitizeCart({ items: [{ ...ok, price: 1e12 }] }).items).toEqual([]);
    expect(sanitizeCart({ items: [{ ...ok, price: 10.5 }] }).items).toEqual([]);
    expect(sanitizeCart({ items: [{ ...ok, stock: -1 }] }).items).toEqual([]);
    expect(sanitizeCart({ items: [{ ...ok, stock: Infinity }] }).items).toEqual([]);
  });
  it('caps huge or infinite quantities', () => {
    expect(sanitizeCart({ items: [{ ...ok, qty: 1e308 }] }).items[0].qty).toBe(5);
    expect(sanitizeCart({ items: [{ ...ok, stock: null, qty: 1e308 }] }).items[0].qty).toBe(99);
    expect(sanitizeCart({ items: [{ ...ok, qty: Infinity }] }).items).toEqual([]);
    expect(sanitizeCart({ items: [{ ...ok, qty: NaN }] }).items).toEqual([]);
  });
  it('unknown stock is still capped when adding or setting quantity', () => {
    const item = { id: 'l', name: 'L', price: 1, stock: null };
    let s = cartReducer(initialCart, { type: 'add', item, qty: 1000 });
    expect(s.items[0].qty).toBe(99);
    s = cartReducer(s, { type: 'setQty', id: 'l', qty: 5000 });
    expect(s.items[0].qty).toBe(99);
  });
});
