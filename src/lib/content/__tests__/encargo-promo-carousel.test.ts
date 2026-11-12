import { describe, expect, it } from 'vitest';
import { encargo } from '@/content/encargo';
import { existencia } from '@/content/existencia';
import { buildSectionCandidate, diffPaths, readSectionRaw, removeOverridePath } from '../encargo-form';
import { overrideDefaults, resolveEncargo } from '../encargo-merge';
import { collectImageUrls, isRestorePath, sanitizeOverrides, sectionSchemas } from '../encargo-schema';
import { buildSectionSpecs } from '../encargo-spec';

const HOST = 'abc123.public.blob.vercel-storage.com';
const url = (n: string) => `https://${HOST}/encargo/promocarousel-${n}.webp`;
const A = url('a');
const B = url('b');
const schemas = sectionSchemas(HOST);
const slide = (u: string, alt = 'Taza promocional') => ({ url: u, alt });

describe('promoCarousel defaults', () => {
  it('exposes the carousel content equal to existencia.carousel with 8 empty slides', () => {
    const c = resolveEncargo(encargo, {});
    expect(c.promoCarousel).toEqual(existencia.carousel);
    expect(c.promoCarousel.slides).toHaveLength(8);
    expect(c.promoCarousel.slides.every((s) => s.image === null)).toBe(true);
    expect(overrideDefaults(encargo).promoCarousel).toEqual({});
  });
});

describe('promoCarousel schema', () => {
  it('accepts up to 8 slots, nulls and a safe url with alt', () => {
    expect(schemas.promoCarousel.safeParse({ slides: [slide(A), null, slide(B)] }).success).toBe(true);
    expect(schemas.promoCarousel.safeParse({ slides: Array(8).fill(slide(A)) }).success).toBe(true);
    expect(schemas.promoCarousel.safeParse({}).success).toBe(true);
  });
  it('rejects too many slots, foreign host, query, hash, missing alt and extra keys', () => {
    expect(schemas.promoCarousel.safeParse({ slides: Array(9).fill(slide(A)) }).success).toBe(false);
    expect(schemas.promoCarousel.safeParse({ slides: [slide('https://evil.test/encargo/x.webp')] }).success).toBe(false);
    expect(schemas.promoCarousel.safeParse({ slides: [slide(`${A}?x=1`)] }).success).toBe(false);
    expect(schemas.promoCarousel.safeParse({ slides: [slide(`${A}#h`)] }).success).toBe(false);
    expect(schemas.promoCarousel.safeParse({ slides: [{ url: A, alt: '' }] }).success).toBe(false);
    expect(schemas.promoCarousel.safeParse({ slides: [{ url: A }] }).success).toBe(false);
    expect(schemas.promoCarousel.safeParse({ slides: [{ ...slide(A), extra: 1 }] }).success).toBe(false);
    expect(schemas.promoCarousel.safeParse({ other: 1 }).success).toBe(false);
  });
  it('is dropped by sanitizeOverrides when invalid, kept when valid', () => {
    const bad = sanitizeOverrides({ promoCarousel: { slides: [slide('https://evil.test/encargo/x.webp')] } }, HOST);
    expect(bad.invalid).toEqual(['promoCarousel']);
    expect(bad.overrides.promoCarousel).toBeUndefined();
    const ok = sanitizeOverrides({ promoCarousel: { slides: [slide(A)] } }, HOST);
    expect(ok.invalid).toEqual([]);
    expect(ok.overrides.promoCarousel?.slides).toEqual([slide(A)]);
  });
});

describe('promoCarousel merge', () => {
  it('fills only the overridden slots by index and keeps labels', () => {
    const c = resolveEncargo(encargo, { promoCarousel: { slides: [null, slide(A, 'Taza'), null, null, null, null, null, slide(B, 'Gorra')] } });
    const s = c.promoCarousel.slides;
    expect(s[0]!.image).toBeNull();
    expect(s[1]).toEqual({ image: A, imageAlt: 'Taza' });
    expect(s[7]).toEqual({ image: B, imageAlt: 'Gorra' });
    expect(s).toHaveLength(8);
    expect(c.promoCarousel.prev).toBe(existencia.carousel.prev);
  });
  it('does not mutate the defaults', () => {
    resolveEncargo(encargo, { promoCarousel: { slides: [slide(A)] } });
    expect(encargo.promoCarousel.slides[0]!.image).toBeNull();
  });
});

describe('promoCarousel form, cleanup and restore', () => {
  it('reads only its allowlisted fields and builds the candidate', () => {
    const fd = new FormData();
    fd.set('slides.0.url', A);
    fd.set('slides.0.alt', 'Taza promocional');
    fd.set('slides.2.url', B);
    fd.set('slides.2.alt', 'Gorra');
    fd.set('slides.8.url', 'ignored');
    fd.set('hack', 'x');
    const raw = readSectionRaw('promoCarousel', fd);
    expect(Object.keys(raw)).toHaveLength(16);
    expect(buildSectionCandidate('promoCarousel', raw)).toEqual({
      slides: [slide(A, 'Taza promocional'), null, slide(B, 'Gorra')],
    });
    expect(buildSectionCandidate('promoCarousel', readSectionRaw('promoCarousel', new FormData()))).toEqual({});
  });
  it('keeps a missing alt so zod can reject it', () => {
    const fd = new FormData();
    fd.set('slides.0.url', A);
    const cand = buildSectionCandidate('promoCarousel', readSectionRaw('promoCarousel', fd));
    expect(schemas.promoCarousel.safeParse(cand).success).toBe(false);
  });
  it('lists every slot url for blob cleanup', () => {
    const { overrides } = sanitizeOverrides({ promoCarousel: { slides: [slide(A), null, slide(B)] } }, HOST);
    expect(collectImageUrls(overrides)).toEqual([A, B]);
  });
  it('restores single slots, not nested paths', () => {
    for (let i = 0; i < 8; i++) expect(isRestorePath('promoCarousel', `slides.${i}`)).toBe(true);
    expect(isRestorePath('promoCarousel', 'slides.8')).toBe(false);
    expect(isRestorePath('promoCarousel', 'slides.0.url')).toBe(false);
    expect(removeOverridePath({ slides: [slide(A), slide(B)] }, 'slides.1')).toEqual({ slides: [slide(A)] });
    expect(removeOverridePath({ slides: [slide(A)] }, 'slides.0')).toBeUndefined();
  });
  it('reports changed slot paths in diffs', () => {
    expect(diffPaths({ slides: [slide(A)] }, { slides: [slide(A), slide(B)] })).toEqual(['slides.1.alt', 'slides.1.url']);
  });
});

describe('promoCarousel admin spec', () => {
  it('lists 8 image slots with alt and reflects overrides', () => {
    const empty = buildSectionSpecs(encargo, {}, new Date()).find((s) => s.key === 'promoCarousel')!;
    expect(empty.fields).toHaveLength(8);
    expect(empty.overridden).toBe(false);
    expect(empty.fields[0]).toMatchObject({ kind: 'image', name: 'slides.0', restore: 'slides.0', overridden: false });
    expect(empty.fields[0]).not.toHaveProperty('decorative');
    const filled = buildSectionSpecs(encargo, { promoCarousel: { slides: [null, slide(A)] } }, new Date()).find(
      (s) => s.key === 'promoCarousel',
    )!;
    expect(filled.overridden).toBe(true);
    expect(filled.fields[1]).toMatchObject({ url: A, alt: 'Taza promocional', overridden: true });
  });
});
