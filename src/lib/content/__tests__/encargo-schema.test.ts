import { describe, expect, it } from 'vitest';
import {
  collectImageUrls,
  isEncargoImageUrl,
  isRestorePath,
  projectSchema,
  sanitizeOverrides,
  sectionSchemas,
} from '../encargo-schema';

const HOST = 'abc123.public.blob.vercel-storage.com';
const GOOD = `https://${HOST}/encargo/foto-AbC123.jpg`;
const schemas = sectionSchemas(HOST);
const ch = (n: number) => String.fromCharCode(n);

describe('isEncargoImageUrl', () => {
  it('accepts https blob host under /encargo/', () => {
    expect(isEncargoImageUrl(GOOD, HOST)).toBe(true);
  });
  it.each([
    `https://${HOST}/productos/x.jpg`,
    `https://${HOST}/encargo/x.jpg?a=1`,
    `https://${HOST}/encargo/x.jpg#h`,
    `https://${HOST}/encargo/../productos/x.jpg`,
    `https://${HOST}/encargo/%2e%2e/x.jpg`,
    `https://${HOST}/encargo/a/b.jpg`,
    `https://${HOST}/encargo/`,
    `http://${HOST}/encargo/x.jpg`,
    `https://user:pw@${HOST}/encargo/x.jpg`,
    `https://${HOST}:8443/encargo/x.jpg`,
    `https://other.public.blob.vercel-storage.com/encargo/x.jpg`,
    'https://evil.com/encargo/x.jpg',
    'data:image/png;base64,AAAA',
    'blob:https://x/encargo/a',
    'javascript:alert(1)',
    '',
  ])('rejects %s', (u) => {
    expect(isEncargoImageUrl(u, HOST)).toBe(false);
  });
});

describe('canonical URLs and missing host (S2, B1, B4)', () => {
  const variants = [
    `HTTPS://${HOST.toUpperCase()}/encargo/x.jpg`,
    `https:${HOST}/encargo/x.jpg`,
    `https:///${HOST}/encargo/x.jpg`,
    `https://${HOST}:443/encargo/x.jpg`,
    `https://${HOST}/./encargo/x.jpg`,
    `https://${HOST}/encargo/x.jpg `,
    `https://${HOST}/encargo/a\n.jpg`,
    `https://${HOST}/encargo/a\t.jpg`,
    ` https://${HOST}/encargo/x.jpg`,
  ];
  it.each(variants)('rejects non-canonical %j', (u) => {
    expect(isEncargoImageUrl(u, HOST)).toBe(false);
  });
  it('with no host nothing is accepted', () => {
    expect(isEncargoImageUrl('https://evil.public.blob.vercel-storage.com/encargo/a.jpg', null)).toBe(false);
    expect(isEncargoImageUrl(GOOD, undefined)).toBe(false);
  });
  it('projects reject non-canonical and host-less images', () => {
    const base = { name: 'A', technique: 'Bordado', tag: 'a', meta: 'a', description: 'a', techniqueDetail: 'a', minimum: 'a', colors: 'a', delivery: 'a', imageAlt: 'Foto', visible: true };
    expect(projectSchema(HOST).safeParse({ ...base, imageUrl: variants[0] }).success).toBe(false);
    expect(projectSchema(null).safeParse({ ...base, imageUrl: GOOD }).success).toBe(false);
  });
});

describe('section schemas', () => {
  it('are strict: unknown keys fail', () => {
    expect(schemas.hero.safeParse({ title: 'Hola', extra: 1 }).success).toBe(false);
    expect(schemas.hero.safeParse({ title: 'Hola' }).success).toBe(true);
    expect(schemas.hero.safeParse(JSON.parse('{"__proto__":{"x":1},"title":"Hola"}')).success).toBe(false);
  });
  it('enforces limits per field', () => {
    expect(schemas.announcement.safeParse({ text: 'x'.repeat(140) }).success).toBe(true);
    expect(schemas.announcement.safeParse({ text: 'x'.repeat(141) }).success).toBe(false);
    expect(schemas.hero.safeParse({ title: 'x'.repeat(91) }).success).toBe(false);
    expect(schemas.taller.safeParse({ stats: [{ value: 'x'.repeat(13) }] }).success).toBe(false);
    expect(schemas.taller.safeParse({ stats: [{ value: '7-10' }, null, null] }).success).toBe(true);
    expect(schemas.taller.safeParse({ stats: [null, null, null, null] }).success).toBe(false);
    expect(schemas.equipos.safeParse({ lines: ['a', 'b', 'c'] }).success).toBe(false);
    expect(schemas.equipos.safeParse({ slides: [null, null, null, null, null] }).success).toBe(false);
  });
  it('image: alt is required (min 3) and url must be ours', () => {
    expect(schemas.hero.safeParse({ image: { url: GOOD, alt: 'Foto' } }).success).toBe(true);
    expect(schemas.hero.safeParse({ image: { url: GOOD } }).success).toBe(false);
    expect(schemas.hero.safeParse({ image: { url: GOOD, alt: 'ab' } }).success).toBe(false);
    expect(schemas.hero.safeParse({ image: { url: GOOD, alt: 'x'.repeat(161) } }).success).toBe(false);
    expect(schemas.hero.safeParse({ image: { url: 'https://evil.com/encargo/a.jpg', alt: 'Foto' } }).success).toBe(false);
  });

  const payloads = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    'a' + ch(0x202e) + 'b',
    'a' + ch(0x200b) + 'b',
    'a`b',
  ];
  const textFields: [keyof typeof schemas, string, (v: string) => unknown][] = [
    ['announcement', 'text', (v) => ({ text: v })],
    ['hero', 'title', (v) => ({ title: v })],
    ['hero', 'alt', (v) => ({ image: { url: GOOD, alt: v } })],
    ['marquee', 'text', (v) => ({ enabled: true, text: v })],
    ['queHacemos', 'eyebrow', (v) => ({ eyebrow: v })],
    ['queHacemos', 'title', (v) => ({ title: v })],
    ['queHacemos', 'body', (v) => ({ body: v })],
    ['queHacemos', 'alt', (v) => ({ images: [{ url: GOOD, alt: v }] })],
    ['tecnicas', 'name', (v) => ({ items: [{ name: v }] })],
    ['tecnicas', 'fact', (v) => ({ items: [{ fact: v }] })],
    ['tecnicas', 'alt', (v) => ({ items: [{ image: { url: GOOD, alt: v } }] })],
    ['projectsIntro', 'lead', (v) => ({ lead: v })],
    ['equipos', 'line', (v) => ({ lines: [v] })],
    ['equipos', 'alt', (v) => ({ slides: [{ url: GOOD, alt: v }] })],
    ['taller', 'paragraph', (v) => ({ paragraph: v })],
    ['taller', 'value', (v) => ({ stats: [{ value: v }] })],
    ['taller', 'label', (v) => ({ stats: [{ label: v }] })],
    ['crossLink', 'body', (v) => ({ body: v })],
    ['crossLink', 'alt', (v) => ({ image: { url: GOOD, alt: v } })],
    ['whatsapp', 'teamQuote', (v) => ({ teamQuote: v })],
  ];
  for (const [section, field, build] of textFields) {
    it(`${section}.${field} rejects XSS / bidi / zero-width payloads`, () => {
      for (const p of payloads) expect(schemas[section].safeParse(build(p)).success).toBe(false);
    });
  }

  it('whatsapp templates: {name} exactly once, no other placeholders', () => {
    const ok = (v: object) => schemas.whatsapp.safeParse(v).success;
    expect(ok({ projectOrder: 'Hola, me interesa "{name}".' })).toBe(true);
    expect(ok({ projectOrder: 'Hola sin nombre' })).toBe(false);
    expect(ok({ projectOrder: '{name} y {name}' })).toBe(false);
    expect(ok({ projectOrder: '{name} {other}' })).toBe(false);
    expect(ok({ bulkQuote: '{name' })).toBe(false);
    expect(ok({ bulkQuote: 'cotizar {nombre}' })).toBe(false);
    expect(ok({ teamQuote: 'Hola equipo' })).toBe(true);
    expect(ok({ teamQuote: 'Hola {name}' })).toBe(false);
    expect(ok({ projectOrder: 'x'.repeat(301) + '{name}' })).toBe(false);
  });

  it('marquee: dates, order and required text', () => {
    const m = schemas.marquee;
    expect(m.safeParse({ enabled: true, text: '2x1', startsOn: '2026-10-01', endsOn: '2026-10-01' }).success).toBe(true);
    expect(m.safeParse({ enabled: true, text: '2x1', startsOn: '2026-10-02', endsOn: '2026-10-01' }).success).toBe(false);
    expect(m.safeParse({ enabled: true }).success).toBe(false);
    expect(m.safeParse({ enabled: false }).success).toBe(true);
    expect(m.safeParse({ text: '2x1', startsOn: '2026-02-30' }).success).toBe(false);
    expect(m.safeParse({ text: '2x1', startsOn: '01/10/2026' }).success).toBe(false);
  });
});

describe('sanitizeOverrides', () => {
  it('drops only the invalid section and reports it', () => {
    const { overrides, invalid } = sanitizeOverrides(
      { hero: { title: 'Hola' }, announcement: { text: '<b>x</b>' }, bogus: {}, taller: { stats: 'no' } },
      HOST,
    );
    expect(overrides).toEqual({ hero: { title: 'Hola' } });
    expect(invalid.sort()).toEqual(['announcement', 'bogus', 'taller']);
  });
  it('re-validates image URLs on read', () => {
    const { overrides, invalid } = sanitizeOverrides({ hero: { image: { url: 'https://evil.com/encargo/a.jpg', alt: 'Foto' } } }, HOST);
    expect(overrides).toEqual({});
    expect(invalid).toEqual(['hero']);
  });
  it('handles junk roots', () => {
    expect(sanitizeOverrides(null).overrides).toEqual({});
    expect(sanitizeOverrides([]).invalid).toEqual(['$root']);
    expect(sanitizeOverrides('x').invalid).toEqual(['$root']);
  });
  it('collects image urls', () => {
    const { overrides } = sanitizeOverrides(
      { hero: { image: { url: GOOD, alt: 'Foto' } }, equipos: { slides: [null, { url: GOOD + 'x', alt: 'Foto' }] } },
      HOST,
    );
    expect(collectImageUrls(overrides)).toEqual([GOOD, GOOD + 'x']);
  });
});

describe('restore path allowlist', () => {
  it('accepts known paths', () => {
    expect(isRestorePath('hero', 'image')).toBe(true);
    expect(isRestorePath('queHacemos', 'images.1')).toBe(true);
    expect(isRestorePath('taller', 'stats.2')).toBe(true);
    expect(isRestorePath('tecnicas', 'items.0.image')).toBe(true);
  });
  it.each([
    ['hero', '__proto__'],
    ['hero', 'image.url'],
    ['hero', 'images.0'],
    ['queHacemos', 'images.3'],
    ['queHacemos', 'images.-1'],
    ['taller', 'stats.3'],
    ['tecnicas', 'items.0.id'],
    ['whatsapp', 'constructor'],
    ['hero', ''],
    ['announcement', 'text.length'],
  ] as const)('rejects %s / %s', (section, field) => {
    expect(isRestorePath(section, field)).toBe(false);
  });
});

describe('projectSchema', () => {
  const base = {
    name: 'Café',
    technique: 'Bordado',
    tag: '2026',
    meta: '12 GORRAS',
    description: 'Descripción',
    techniqueDetail: 'Bordado',
    minimum: '1 pieza',
    colors: 'negro',
    delivery: '7 a 10 días',
    imageUrl: '',
    imageAlt: '',
    visible: true,
  };
  const s = projectSchema(HOST);
  it('accepts a valid project and maps an empty image to null', () => {
    const r = s.safeParse(base);
    expect(r.success && r.data.imageUrl).toBe(null);
  });
  it('is strict: sortOrder, id and unknown keys are refused', () => {
    expect(s.safeParse({ ...base, sortOrder: 3 }).success).toBe(false);
    expect(s.safeParse({ ...base, id: 'x' }).success).toBe(false);
  });
  it('requires alt with an image, and only our /encargo/ images', () => {
    expect(s.safeParse({ ...base, imageUrl: GOOD, imageAlt: '' }).success).toBe(false);
    expect(s.safeParse({ ...base, imageUrl: GOOD, imageAlt: 'Foto' }).success).toBe(true);
    expect(s.safeParse({ ...base, imageUrl: `https://${HOST}/productos/a.jpg`, imageAlt: 'Foto' }).success).toBe(false);
  });
  it('technique is an enum; limits enforced', () => {
    expect(s.safeParse({ ...base, technique: 'Otra' }).success).toBe(false);
    expect(s.safeParse({ ...base, name: 'x'.repeat(61) }).success).toBe(false);
    expect(s.safeParse({ ...base, description: 'x'.repeat(401) }).success).toBe(false);
    expect(s.safeParse({ ...base, name: '<b>x</b>' }).success).toBe(false);
    expect(s.safeParse({ ...base, imageAlt: '<x>' }).success).toBe(false);
  });
});
