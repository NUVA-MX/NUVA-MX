import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encargo } from '@/content/encargo';
import { projects as defaultProjects } from '@/content/projects';
import { defaultProjectRows } from '@/lib/content/seed-projects';
import { setLogSink } from '@/server/log/logger';

const HOST = 'abc123.public.blob.vercel-storage.com';
const url = (n: string) => `https://${HOST}/encargo/${n}.jpg`;

const m = vi.hoisted(() => ({ getDb: vi.fn(), isDbConfigured: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ getDb: m.getDb }));
vi.mock('@/lib/db/config', () => ({ isDbConfigured: m.isDbConfigured }));
vi.mock('@/server/env', () => ({
  blobToken: () => 'vercel_blob_rw_abc123_secretsecret',
  getEnvSafe: () => null,
  liveSecretValues: () => [],
}));

import { buildEncargoPage, getEncargoPage } from '../encargo';

const NOW = new Date('2026-10-06T12:00:00Z');
const rows = (n = 6) =>
  defaultProjectRows()
    .slice(0, n)
    .map((r, i) => ({ ...r, id: `00000000-0000-4000-8000-00000000000${i}` }));

describe('buildEncargoPage', () => {
  const build = (rawData: unknown, projectRows: ReturnType<typeof rows> | null, extra = {}) =>
    buildEncargoPage({ rawData, rows: projectRows, now: NOW, host: HOST, ...extra });

  it('empty DB: exactly the hard-coded content and the 6 default projects', () => {
    const p = build(null, []);
    expect(p.content).toEqual(encargo);
    expect(p.projects).toEqual(defaultProjects);
    expect(p.marquee).toEqual({ text: encargo.marquee, defaultText: encargo.marquee, promo: null });
  });
  it('no rows at all (null) also means defaults', () => {
    expect(build({}, null).projects).toEqual(defaultProjects);
  });
  it('applies valid overrides', () => {
    const p = build({ announcement: { text: 'Aviso' }, hero: { image: { url: url('h'), alt: 'Hero' } } }, []);
    expect(p.content.announcement).toBe('Aviso');
    expect(p.content.hero.image).toBe(url('h'));
  });
  it('a corrupted section only falls back for that section', () => {
    const bad: string[] = [];
    const p = build(
      { announcement: { text: '<script>' }, hero: { title: 'Título nuevo' }, taller: { stats: 7 } },
      [],
      { onInvalidSection: (s: string) => bad.push(s) },
    );
    expect(p.content.announcement).toBe(encargo.announcement);
    expect(p.content.hero.title).toBe('Título nuevo');
    expect(p.content.taller).toEqual(encargo.taller);
    expect(bad.sort()).toEqual(['announcement', 'taller']);
  });
  it('image URLs are re-validated on read and fall back to the default', () => {
    const p = build({ hero: { image: { url: 'https://evil.com/encargo/a.jpg', alt: 'Hero' } } }, []);
    expect(p.content.hero.image).toBe(null);
  });
  it('hides hidden projects, keeps the DB order and skips invalid rows', () => {
    const r = rows();
    r[1]!.visible = false;
    r[2]!.name = '<b>mal</b>';
    const bad: string[] = [];
    const p = build({}, r, { onInvalidProject: (id: string) => bad.push(id) });
    expect(p.projects.map((x) => x.id)).toEqual([r[0]!.id, r[3]!.id, r[4]!.id, r[5]!.id]);
    expect(bad).toEqual([r[2]!.id]);
    expect(p.projects[0]!.detail.technique).toBe(r[0]!.techniqueDetail);
  });
  it('all projects hidden: no projects (section not rendered), not the defaults', () => {
    const r = rows().map((x) => ({ ...x, visible: false }));
    expect(build({}, r).projects).toEqual([]);
  });
  it('promo: active inside the window, hidden when far in the future', () => {
    const active = build({ marquee: { enabled: true, text: '2x1', startsOn: '2026-10-05', endsOn: '2026-10-07' } }, []);
    expect(active.marquee.text).toBe('2x1');
    expect(active.marquee.promo).toMatchObject({ text: '2x1', startsAt: '2026-10-05T06:00:00.000Z', endsAt: '2026-10-08T06:00:00.000Z' });
    const future = build({ marquee: { enabled: true, text: '2x1', startsOn: '2026-10-20' } }, []);
    expect(future.marquee.text).toBe(encargo.marquee);
    expect(JSON.stringify(future)).not.toContain('2x1');
  });
});

describe('getEncargoPage', () => {
  const lines: string[] = [];
  beforeEach(() => {
    lines.length = 0;
    setLogSink((l) => void lines.push(l));
    m.getDb.mockReset();
    m.isDbConfigured.mockReset();
  });
  afterEach(() => {
    setLogSink(null);
    vi.useRealTimers();
  });

  const dbReturning = (contentRows: unknown[], projectRows: unknown[]) => ({
    select: (cols?: unknown) => ({
      from: () =>
        cols
          ? { limit: async () => contentRows }
          : { orderBy: () => ({ limit: async () => projectRows }) },
    }),
  });

  it('without a database returns the defaults and never touches the DB', async () => {
    m.isDbConfigured.mockReturnValue(false);
    const p = await getEncargoPage();
    expect(p.content).toEqual(encargo);
    expect(m.getDb).not.toHaveBeenCalled();
  });
  it('loads overrides and projects from the DB', async () => {
    m.isDbConfigured.mockReturnValue(true);
    m.getDb.mockReturnValue(dbReturning([{ data: { announcement: { text: 'Desde DB' } } }], rows(2)));
    const p = await getEncargoPage();
    expect(p.content.announcement).toBe('Desde DB');
    expect(p.projects).toHaveLength(2);
  });
  it('a throwing DB yields the defaults and logs encargo.content_load_failed', async () => {
    m.isDbConfigured.mockReturnValue(true);
    m.getDb.mockImplementation(() => {
      throw new Error('boom');
    });
    const p = await getEncargoPage();
    expect(p.content).toEqual(encargo);
    expect(p.projects).toEqual(defaultProjects);
    expect(lines.some((l) => l.includes('encargo.content_load_failed'))).toBe(true);
  });
  it('a DB that hangs past 3 s falls back to the defaults', async () => {
    vi.useFakeTimers();
    m.isDbConfigured.mockReturnValue(true);
    m.getDb.mockReturnValue({ select: () => ({ from: () => ({ limit: () => new Promise(() => {}), orderBy: () => ({ limit: () => new Promise(() => {}) }) }) }) });
    const pending = getEncargoPage();
    await vi.advanceTimersByTimeAsync(3000);
    const p = await pending;
    expect(p.content).toEqual(encargo);
    expect(lines.some((l) => l.includes('encargo.content_load_failed'))).toBe(true);
  });
  it('logs encargo.content_invalid with the section key for a corrupted section', async () => {
    m.isDbConfigured.mockReturnValue(true);
    m.getDb.mockReturnValue(dbReturning([{ data: { hero: { title: 5 } } }], []));
    await getEncargoPage();
    expect(lines.some((l) => l.includes('encargo.content_invalid') && l.includes('hero'))).toBe(true);
  });
});
