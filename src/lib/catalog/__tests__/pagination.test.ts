import { describe, expect, it } from 'vitest';
import { pageWindow, parsePageParam } from '../pagination';

describe('pageWindow', () => {
  it('lists every page when there are 7 or fewer', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps first, last and neighbours with gaps in between', () => {
    expect(pageWindow(1, 61)).toEqual([1, 2, 'gap', 60, 61]);
    expect(pageWindow(30, 61)).toEqual([1, 2, 'gap', 29, 30, 31, 'gap', 60, 61]);
    expect(pageWindow(61, 61)).toEqual([1, 2, 'gap', 60, 61]);
  });

  it('fills a single skipped page instead of showing a gap', () => {
    expect(pageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 19, 20]);
  });
});

describe('parsePageParam', () => {
  it('accepts whole numbers 1..200 and falls back to 1', () => {
    expect(parsePageParam('?pagina=5')).toBe(5);
    expect(parsePageParam('')).toBe(1);
    expect(parsePageParam('?pagina=0')).toBe(1);
    expect(parsePageParam('?pagina=-3')).toBe(1);
    expect(parsePageParam('?pagina=2.5')).toBe(1);
    expect(parsePageParam('?pagina=abc')).toBe(1);
    expect(parsePageParam('?pagina=201')).toBe(1);
  });
});
