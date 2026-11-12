import { describe, expect, it } from 'vitest';
import { encargo } from '@/content/encargo';
import { buildSectionCandidate, readSectionRaw, removeOverridePath } from '../encargo-form';
import { overrideDefaults, resolveEncargo } from '../encargo-merge';
import { collectImageUrls, isRestorePath, sanitizeOverrides, sectionSchemas } from '../encargo-schema';
import { buildSectionSpecs } from '../encargo-spec';

const HOST = 'abc123.public.blob.vercel-storage.com';
const GOOD = `https://${HOST}/encargo/taller-small.webp`;
const CTA = `https://${HOST}/encargo/proceso-fondo.webp`;
const schemas = sectionSchemas(HOST);

describe('taller.image2', () => {
  it('defaults to no image with its own alt', () => {
    expect(encargo.taller.image2).toBeNull();
    expect(encargo.taller.image2Alt.length).toBeGreaterThan(2);
  });
  it('schema requires a safe url and alt', () => {
    expect(schemas.taller.safeParse({ image2: { url: GOOD, alt: 'Detalle del taller' } }).success).toBe(true);
    expect(schemas.taller.safeParse({ image2: { url: GOOD, alt: '' } }).success).toBe(false);
    expect(schemas.taller.safeParse({ image2: { url: 'https://evil.test/encargo/x.jpg', alt: 'Detalle' } }).success).toBe(false);
    expect(schemas.taller.safeParse({ image2: { url: `${GOOD}?x=1`, alt: 'Detalle' } }).success).toBe(false);
  });
  it('merges into image2 / image2Alt without touching image', () => {
    const c = resolveEncargo(encargo, { taller: { image2: { url: GOOD, alt: 'Detalle del taller' } } });
    expect(c.taller.image2).toBe(GOOD);
    expect(c.taller.image2Alt).toBe('Detalle del taller');
    expect(c.taller.image).toBeNull();
  });
  it('is read, built, listed for cleanup and restorable', () => {
    const fd = new FormData();
    fd.set('image2.url', GOOD);
    fd.set('image2.alt', 'Detalle del taller');
    fd.set('image.url', 'ignored-not-blank');
    const cand = buildSectionCandidate('taller', readSectionRaw('taller', fd));
    expect(cand.image2).toEqual({ url: GOOD, alt: 'Detalle del taller' });
    const { overrides } = sanitizeOverrides({ taller: { image2: cand.image2 } }, HOST);
    expect(collectImageUrls(overrides)).toEqual([GOOD]);
    expect(isRestorePath('taller', 'image2')).toBe(true);
    expect(removeOverridePath({ image2: cand.image2, title: 'T' }, 'image2')).toEqual({ title: 'T' });
  });
  it('appears in the admin spec as an image field with alt', () => {
    const t = buildSectionSpecs(encargo, {}, new Date()).find((s) => s.key === 'taller')!;
    const f = t.fields.find((x) => x.kind === 'image' && x.name === 'image2');
    expect(f).toMatchObject({ kind: 'image', restore: 'image2' });
    expect(f).not.toHaveProperty('decorative');
  });
});

describe('proceso.ctaImage', () => {
  it('defaults to null', () => {
    expect(encargo.proceso.cta.image).toBeNull();
    expect(overrideDefaults(encargo).proceso).toEqual({});
  });
  it('schema takes only a safe url (no alt) and rejects extras', () => {
    expect(schemas.proceso.safeParse({ ctaImage: { url: CTA } }).success).toBe(true);
    expect(schemas.proceso.safeParse({ ctaImage: { url: CTA, alt: 'x' } }).success).toBe(false);
    expect(schemas.proceso.safeParse({ ctaImage: { url: 'https://evil.test/encargo/x.jpg' } }).success).toBe(false);
    expect(schemas.proceso.safeParse({ ctaImage: { url: `${CTA}#h` } }).success).toBe(false);
    expect(schemas.proceso.safeParse({ other: 1 }).success).toBe(false);
  });
  it('merges into proceso.cta.image; unset keeps null', () => {
    expect(resolveEncargo(encargo, {}).proceso.cta.image).toBeNull();
    expect(resolveEncargo(encargo, { proceso: { ctaImage: { url: CTA } } }).proceso.cta.image).toBe(CTA);
  });
  it('is read, built, sanitized, listed for cleanup and restorable', () => {
    const fd = new FormData();
    fd.set('ctaImage.url', CTA);
    expect(buildSectionCandidate('proceso', readSectionRaw('proceso', fd))).toEqual({ ctaImage: { url: CTA } });
    expect(buildSectionCandidate('proceso', readSectionRaw('proceso', new FormData()))).toEqual({});
    const { overrides, invalid } = sanitizeOverrides({ proceso: { ctaImage: { url: CTA } } }, HOST);
    expect(invalid).toEqual([]);
    expect(collectImageUrls(overrides)).toEqual([CTA]);
    expect(isRestorePath('proceso', 'ctaImage')).toBe(true);
    expect(isRestorePath('proceso', 'ctaImage.url')).toBe(false);
  });
  it('is dropped by sanitizeOverrides when the url is foreign', () => {
    const { overrides, invalid } = sanitizeOverrides({ proceso: { ctaImage: { url: 'https://evil.test/encargo/x.jpg' } } }, HOST);
    expect(invalid).toEqual(['proceso']);
    expect(overrides.proceso).toBeUndefined();
  });
  it('appears in the admin spec as a decorative image field', () => {
    const p = buildSectionSpecs(encargo, { proceso: { ctaImage: { url: CTA } } }, new Date()).find((s) => s.key === 'proceso')!;
    expect(p.overridden).toBe(true);
    expect(p.fields[0]).toMatchObject({ kind: 'image', name: 'ctaImage', url: CTA, decorative: true, overridden: true });
  });
});
