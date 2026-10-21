import { describe, expect, it } from 'vitest';
import { isSafeUploadPath } from '../blob';

describe('isSafeUploadPath', () => {
  it.each(['productos/x.jpg', 'encargo/x.jpg', 'encargo/foto-1.webp'])('accepts %s', (p) => {
    expect(isSafeUploadPath(p)).toBe(true);
  });
  it.each([
    'encargo/../productos/x',
    'encargo/',
    'Encargo/x',
    'encargo/a/b.jpg',
    'other/x',
    'encargo/.x',
    'encargo/X.jpg',
    'productos/../encargo/x',
    '/encargo/x.jpg',
    '',
  ])('rejects %s', (p) => {
    expect(isSafeUploadPath(p)).toBe(false);
  });
  it('honors an explicit prefix', () => {
    expect(isSafeUploadPath('encargo/x.jpg', 'productos/')).toBe(false);
    expect(isSafeUploadPath('encargo/x.jpg', 'encargo/')).toBe(true);
  });
});
