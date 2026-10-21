import { describe, expect, it } from 'vitest';
import { isEmailAllowed, parseAdminEmails } from '../auth/emails';
import { isAllowedImageUrl, isProductImageUrl, readProductForm } from '../products/validation';

describe('parseAdminEmails', () => {
  it('recorta, pasa a minúsculas y quita vacíos y duplicados', () => {
    expect(parseAdminEmails(' A@x.com, b@Y.com ,, a@X.COM ')).toEqual(['a@x.com', 'b@y.com']);
  });
  it('vacío o indefinido -> []', () => {
    expect(parseAdminEmails('')).toEqual([]);
    expect(parseAdminEmails(undefined)).toEqual([]);
  });
});

describe('isEmailAllowed', () => {
  it('compara sin importar mayúsculas', () => {
    expect(isEmailAllowed('  Admin@Nuva.MX ', 'admin@nuva.mx')).toBe(true);
  });
  it('rechaza correos fuera de la lista y listas vacías', () => {
    expect(isEmailAllowed('otro@nuva.mx', 'admin@nuva.mx')).toBe(false);
    expect(isEmailAllowed('', '')).toBe(false);
  });
});

describe('isAllowedImageUrl', () => {
  it('acepta Vercel Blob por https', () => {
    expect(isAllowedImageUrl('https://abc123.public.blob.vercel-storage.com/productos/gorra-x1.jpg')).toBe(true);
  });
  it.each([
    'http://abc.public.blob.vercel-storage.com/a.jpg',
    'https://evil.com/a.jpg',
    'https://public.blob.vercel-storage.com.evil.com/a.jpg',
    'javascript:alert(1)',
    'https://user:pw@abc.public.blob.vercel-storage.com/a.jpg',
  ])('rechaza %s', (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });
});

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe('readProductForm', () => {
  it('convierte vacíos a null y números a enteros', () => {
    const r = readProductForm(form({ name: ' Gorra ', price: '390', stock: '', visible: 'on' }));
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ name: 'Gorra', price: 390, stock: null, meta: null, imageUrl: null, visible: true, sortOrder: 0 });
  });
  it('requiere nombre', () => {
    const r = readProductForm(form({ name: '  ' }));
    expect(r.success).toBe(false);
  });
  it('rechaza precios negativos o con decimales', () => {
    expect(readProductForm(form({ name: 'A', price: '-1' })).success).toBe(false);
    expect(readProductForm(form({ name: 'A', price: '3.5' })).success).toBe(false);
  });
  it('rechaza imágenes fuera de Vercel Blob', () => {
    expect(readProductForm(form({ name: 'A', imageUrl: 'https://evil.com/x.jpg' })).success).toBe(false);
  });
  it('checkbox ausente -> no visible', () => {
    expect(readProductForm(form({ name: 'A' })).data?.visible).toBe(false);
  });
});

describe('isProductImageUrl (S2/S3/S4)', () => {
  const host = 'abc123.public.blob.vercel-storage.com';
  it('accepts canonical /productos/ on our host only', () => {
    expect(isProductImageUrl(`https://${host}/productos/a-x1.jpg`, host)).toBe(true);
  });
  it.each([
    `https://${host}/encargo/a.jpg`,
    `HTTPS://${host.toUpperCase()}/productos/a.jpg`,
    `https://${host}:443/productos/a.jpg`,
    `https://${host}/productos/a.jpg `,
    `https://${host}/productos/a/b.jpg`,
    'https://other.public.blob.vercel-storage.com/productos/a.jpg',
  ])('rejects %j', (u) => {
    expect(isProductImageUrl(u, host)).toBe(false);
  });
  it('without a host nothing is accepted', () => {
    expect(isProductImageUrl(`https://${host}/productos/a.jpg`, null)).toBe(false);
  });
});
