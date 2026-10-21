import { describe, expect, it } from 'vitest';
import { encargo } from '@/content/encargo';
import { marqueeAt, overrideDefaults, PROMO_LEAD_MS, resolveEncargo, resolveMarquee } from '../encargo-merge';
import { mxDayEndUtc, mxDayStartUtc } from '../mx-date';
import { sanitizeOverrides } from '../encargo-schema';
import { projects } from '@/content/projects';
import { defaultProjectRows, rowToProject } from '../seed-projects';

const HOST = 'abc123.public.blob.vercel-storage.com';
const url = (n: string) => `https://${HOST}/encargo/${n}.jpg`;

describe('resolveEncargo', () => {
  it('with no overrides equals the defaults', () => {
    expect(resolveEncargo(encargo, {})).toEqual(encargo);
  });
  it('does not mutate the defaults', () => {
    const before = JSON.stringify(encargo);
    resolveEncargo(encargo, { hero: { title: 'Otro' } });
    expect(JSON.stringify(encargo)).toBe(before);
  });
  it('merges field by field and by index', () => {
    const c = resolveEncargo(encargo, {
      announcement: { text: 'Aviso' },
      hero: { image: { url: url('h'), alt: 'Hero alt' } },
      queHacemos: { title: 'Nuevo', images: [null, { url: url('q1'), alt: 'Detalle' }] },
      tecnicas: { items: [null, { name: 'DTF' }, { image: { url: url('t2'), alt: 'Lote' } }] },
      equipos: { lines: ['Primera'], slides: [null, null, { url: url('e2'), alt: 'Slide' }] },
      taller: { stats: [{ value: '500' }, null, { label: 'Semanas' }] },
      projectsIntro: { lead: 'Lead nuevo' },
      whatsapp: { projectOrder: 'P {name}', bulkQuote: 'B {name}', teamQuote: 'T' },
    });
    expect(c.announcement).toBe('Aviso');
    expect(c.hero.title).toBe(encargo.hero.title);
    expect(c.hero.image).toBe(url('h'));
    expect(c.hero.imageAlt).toBe('Hero alt');
    expect(c.queHacemos.title).toBe('Nuevo');
    expect(c.queHacemos.eyebrow).toBe(encargo.queHacemos.eyebrow);
    expect(c.queHacemos.images[0].image).toBe(null);
    expect(c.queHacemos.images[1]).toMatchObject({ image: url('q1'), imageAlt: 'Detalle', label: encargo.queHacemos.images[1].label });
    expect(c.tecnicas.items[1]).toMatchObject({ id: 'estampado', name: 'DTF', fact: encargo.tecnicas.items[1].fact });
    expect(c.tecnicas.items[2].image).toBe(url('t2'));
    expect(c.equipos.lines).toEqual(['Primera']);
    expect(c.equipos.slides[2].image).toBe(url('e2'));
    expect(c.equipos.slides).toHaveLength(4);
    // Two default stats: an override at index 2 is beyond the fixed length and is ignored.
    expect(c.taller.stats).toEqual([
      { value: '500', label: encargo.taller.stats[0].label },
      { value: encargo.taller.stats[1].value, label: encargo.taller.stats[1].label },
    ]);
    expect(c.projects.lead).toBe('Lead nuevo');
    expect(c.projects.whatsappTemplate).toBe('P {name}');
    expect(c.projects.quoteTemplate).toBe('B {name}');
    expect(c.equipos.ctaMessage).toBe('T');
    expect(c.contacto).toEqual(encargo.contacto);
  });
  it('ignores indexes beyond the fixed length', () => {
    const { overrides } = sanitizeOverrides({ equipos: { lines: ['a', 'b'] } }, HOST);
    const c = resolveEncargo(encargo, { ...overrides, taller: { stats: [null, null, null] } });
    expect(c.equipos.lines).toHaveLength(encargo.equipos.lines.length);
    expect(c.taller.stats).toHaveLength(encargo.taller.stats.length);
  });
  it('overrideDefaults mirrors the override shape', () => {
    const d = overrideDefaults(encargo);
    expect(d.announcement).toEqual({ text: encargo.announcement });
    expect(d.whatsapp).toEqual({
      projectOrder: encargo.projects.whatsappTemplate,
      bulkQuote: encargo.projects.quoteTemplate,
      teamQuote: encargo.equipos.ctaMessage,
    });
  });
});

describe('marquee', () => {
  const DEFAULT = 'Tu diseño, nuestro taller.';
  const promo = { enabled: true, text: '2x1 en gorras', startsOn: '2026-10-05', endsOn: '2026-10-07' };
  const start = mxDayStartUtc('2026-10-05').getTime();
  const end = mxDayEndUtc('2026-10-07').getTime();
  const at = (ms: number, o: Parameters<typeof resolveMarquee>[1] = promo) => resolveMarquee(DEFAULT, o, new Date(ms));

  it('before the window: default text, promo hidden unless within 10 minutes', () => {
    const far = at(start - PROMO_LEAD_MS - 1);
    expect(far).toMatchObject({ text: DEFAULT, isPromo: false, promo: null });
    const near = at(start - PROMO_LEAD_MS);
    expect(near.text).toBe(DEFAULT);
    expect(near.promo?.text).toBe('2x1 en gorras');
    expect(near.nextBoundary?.getTime()).toBe(start);
  });
  it('promo shows exactly at 00:00 MX start and through the last millisecond of the end day', () => {
    expect(at(start - 1).isPromo).toBe(false);
    expect(at(start).isPromo).toBe(true);
    expect(at(start).text).toBe('2x1 en gorras');
    expect(at(end - 1).isPromo).toBe(true);
    expect(at(end - 1).nextBoundary?.getTime()).toBe(end);
  });
  it('reverts exactly after the end and drops the promo', () => {
    const r = at(end);
    expect(r).toMatchObject({ text: DEFAULT, isPromo: false, promo: null, nextBoundary: null });
    expect(at(end + 86_400_000).promo).toBe(null);
  });
  it('23:59:59 MX on the end day is still promo', () => {
    // 2026-10-07 23:59:59 MX = 2026-10-08T05:59:59Z
    expect(at(Date.parse('2026-10-08T05:59:59Z')).isPromo).toBe(true);
    expect(at(Date.parse('2026-10-08T06:00:00Z')).isPromo).toBe(false);
  });
  it('missing ends are open-ended', () => {
    const noEnd = { enabled: true, text: 'Promo', startsOn: '2026-10-05' };
    expect(at(start + 10 * 86_400_000, noEnd)).toMatchObject({ isPromo: true, nextBoundary: null });
    const noStart = { enabled: true, text: 'Promo', endsOn: '2026-10-07' };
    expect(at(0, noStart).isPromo).toBe(true);
    expect(at(end, noStart).isPromo).toBe(false);
    const always = { enabled: true, text: 'Promo' };
    expect(at(123456, always)).toMatchObject({ isPromo: true, nextBoundary: null });
  });
  it('disabled or absent override shows the default', () => {
    expect(at(start, { ...promo, enabled: false })).toMatchObject({ text: DEFAULT, promo: null });
    expect(resolveMarquee(DEFAULT, undefined, new Date(start))).toMatchObject({ text: DEFAULT, promo: null });
  });
  it('client guard: marqueeAt switches exactly at the boundaries', () => {
    const w = { text: 'P', startsAt: new Date(start), endsAt: new Date(end) };
    expect(marqueeAt(DEFAULT, w, new Date(start - 1)).text).toBe(DEFAULT);
    expect(marqueeAt(DEFAULT, w, new Date(start - 1)).nextBoundary?.getTime()).toBe(start);
    expect(marqueeAt(DEFAULT, w, new Date(start)).text).toBe('P');
    expect(marqueeAt(DEFAULT, w, new Date(end - 1)).text).toBe('P');
    expect(marqueeAt(DEFAULT, w, new Date(end)).text).toBe(DEFAULT);
    expect(marqueeAt(DEFAULT, null, new Date(start)).text).toBe(DEFAULT);
  });
});

describe('default projects', () => {
  it('maps the 6 hard-coded projects to valid rows and back', () => {
    const rows = defaultProjectRows();
    expect(rows).toHaveLength(6);
    rows.forEach((r, i) => {
      const back = rowToProject({ ...r, id: projects[i].id }, HOST);
      expect(back).toEqual(projects[i]);
      expect(r.sortOrder).toBe(i);
    });
  });
  it('rowToProject returns null for an invalid row', () => {
    const r = { ...defaultProjectRows()[0], id: 'x', name: '<b>' };
    expect(rowToProject(r, HOST)).toBe(null);
  });
});
