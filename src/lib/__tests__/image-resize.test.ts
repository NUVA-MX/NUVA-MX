import { describe, expect, it } from 'vitest';
import { isSafeUploadPath } from '../blob';
import { buildUploadName, sectionSlug, targetSize } from '../image-resize';

describe('targetSize', () => {
  it('downscales landscape on the long edge', () => {
    expect(targetSize(4800, 3200)).toEqual({ width: 2400, height: 1600 });
  });
  it('downscales portrait on the long edge', () => {
    expect(targetSize(3000, 6000)).toEqual({ width: 1200, height: 2400 });
  });
  it('never upscales', () => {
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(targetSize(2400, 2400)).toEqual({ width: 2400, height: 2400 });
  });
  it('keeps at least 1px', () => {
    expect(targetSize(100000, 10).height).toBe(1);
  });
});

describe('sectionSlug', () => {
  it('keeps only lowercase letters and digits', () => {
    expect(sectionSlug('queHacemos')).toBe('quehacemos');
    expect(sectionSlug('Cross-Link_2')).toBe('crosslink2');
    expect(sectionSlug(undefined)).toBe('');
    expect(sectionSlug('../x')).toBe('x');
  });
  it('caps the length', () => {
    expect(sectionSlug('a'.repeat(50))).toHaveLength(20);
  });
});

describe('buildUploadName', () => {
  it('prefixes section and sanitizes the file name', () => {
    expect(buildUploadName('encargo/', 'Mi Foto Ñandú.JPG', 'hero')).toBe('encargo/hero-mi-foto-nandu.jpg');
  });
  it('swaps the extension to .webp when re-encoded', () => {
    expect(buildUploadName('encargo/', 'foto.png', 'taller', true)).toBe('encargo/taller-foto.webp');
    expect(buildUploadName('productos/', 'foto', undefined, true)).toBe('productos/foto.webp');
  });
  it('omits the section when not provided', () => {
    expect(buildUploadName('productos/', 'a.png')).toBe('productos/a.png');
  });
  it('falls back to a default stem', () => {
    expect(buildUploadName('encargo/', '???.png', 'hero')).toBe('encargo/hero-foto.png');
    expect(buildUploadName('encargo/', '???', 'hero', true)).toBe('encargo/hero-foto.webp');
  });
  it('always passes isSafeUploadPath, even for long or hostile names', () => {
    const names = ['a'.repeat(300) + '.png', '../../etc/passwd', 'x/y\\z.jpg', '日本語.png', '-.-', '...'];
    for (const prefix of ['encargo/', 'productos/'] as const) {
      for (const n of names) {
        for (const webp of [false, true]) {
          for (const sec of [undefined, 'hero', 'a'.repeat(60), '../']) {
            const out = buildUploadName(prefix, n, sec, webp);
            expect(isSafeUploadPath(out, prefix), out).toBe(true);
          }
        }
      }
    }
  });
});
