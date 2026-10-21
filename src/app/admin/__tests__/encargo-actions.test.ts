import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encargo } from '@/content/encargo';
import { SECTION_FIELD_NAMES } from '@/lib/content/encargo-form';
import { SECTION_KEYS, type SectionKey } from '@/lib/content/encargo-schema';

const HOST = 'abc123.public.blob.vercel-storage.com';
const GOOD_URL = `https://${HOST}/encargo/foto-x1.jpg`;
const ADMIN = { id: '11111111-1111-4111-8111-111111111111', email: 'a@nuva.mx' };
const VALID_ID = '22222222-2222-4222-8222-222222222222';
const ch = (n: number) => String.fromCharCode(n);

const m = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getDb: vi.fn(),
  enforceRateLimit: vi.fn(),
  audit: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  del: vi.fn(),
  store: {
    writeSection: vi.fn(),
    deleteUnreferencedBlobs: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    toggleProjectVisible: vi.fn(),
    moveProject: vi.fn(),
    deleteProject: vi.fn(),
    importDefaultProjects: vi.fn(),
  },
}));

vi.mock('@/lib/auth/admin', () => ({ requireAdmin: m.requireAdmin }));
vi.mock('@/lib/db/client', () => ({ getDb: m.getDb }));
vi.mock('@vercel/blob', () => ({ del: m.del }));
vi.mock('next/cache', () => ({ revalidatePath: m.revalidatePath }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));
vi.mock('@/server/audit/audit', () => ({ audit: m.audit }));
vi.mock('@/server/ratelimit/guard', () => ({ enforceRateLimit: m.enforceRateLimit }));
vi.mock('@/server/http/next-context', () => ({ currentContext: async () => ({ ip: '1.1.1.1', requestId: 'req-1' }) }));
vi.mock('@/server/env', () => ({
  blobToken: () => 'vercel_blob_rw_abc123_secretsecret',
  getEnvSafe: () => null,
  liveSecretValues: () => [],
}));
vi.mock('@/server/content/encargo-store', () => ({
  ContentInvalidError: class ContentInvalidError extends Error {},
  ...m.store,
}));

import * as actions from '../encargo-actions';

const fd = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

const validProject = {
  name: 'Café',
  technique: 'Bordado',
  tag: '2026',
  meta: '12 GORRAS',
  description: 'Descripción del proyecto',
  techniqueDetail: 'Bordado frontal',
  minimum: '1 pieza',
  colors: 'negro',
  delivery: '7 a 10 días',
  imageUrl: '',
  imageAlt: '',
};

/** Calls any exported action with a form shaped for it. */
const callers: Record<string, () => Promise<unknown>> = {
  saveEncargoSectionAction: () => actions.saveEncargoSectionAction({}, fd({ section: 'announcement', text: 'Hola' })),
  restoreEncargoAction: () => actions.restoreEncargoAction({}, fd({ section: 'hero', field: 'title' })),
  saveEncargoProjectAction: () => actions.saveEncargoProjectAction({}, fd(validProject)),
  toggleEncargoProjectVisibleAction: () => actions.toggleEncargoProjectVisibleAction({}, fd({ id: VALID_ID })),
  moveEncargoProjectAction: () => actions.moveEncargoProjectAction({}, fd({ id: VALID_ID, direction: 'up' })),
  deleteEncargoProjectAction: () => actions.deleteEncargoProjectAction({}, fd({ id: VALID_ID })),
  importDefaultProjectsAction: () => actions.importDefaultProjectsAction(),
};

const storeCalls = () => Object.values(m.store).reduce((n, f) => n + f.mock.calls.length, 0);

beforeEach(() => {
  vi.resetAllMocks();
  m.requireAdmin.mockResolvedValue(ADMIN);
  m.enforceRateLimit.mockResolvedValue({ ok: true });
  m.audit.mockResolvedValue(undefined);
  m.redirect.mockImplementation((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  });
  m.store.writeSection.mockImplementation(async (opts: { update: (c: unknown) => unknown }) => {
    const after = opts.update(undefined);
    return { before: undefined, after, removedUrls: [] };
  });
  m.store.deleteUnreferencedBlobs.mockResolvedValue(undefined);
  m.store.createProject.mockResolvedValue({ id: VALID_ID });
  m.store.updateProject.mockResolvedValue({ previousImage: null });
  m.store.toggleProjectVisible.mockResolvedValue(true);
  m.store.moveProject.mockResolvedValue(true);
  m.store.deleteProject.mockResolvedValue({ imageUrl: null });
  m.store.importDefaultProjects.mockResolvedValue(6);
});

describe('(a) every exported action calls requireAdmin before anything else', () => {
  it('the file exports exactly the known actions (update this list and the callers together)', () => {
    const exported = Object.keys(actions).sort();
    expect(exported).toEqual(Object.keys(callers).sort());
    for (const name of exported) expect(typeof (actions as Record<string, unknown>)[name]).toBe('function');
  });

  for (const name of Object.keys(callers)) {
    it(`${name}: no session means no db, store, rate limit, audit or blob delete`, async () => {
      m.requireAdmin.mockRejectedValue(new Error('NEXT_REDIRECT:/admin/login'));
      await expect(callers[name]!()).rejects.toThrow('NEXT_REDIRECT:/admin/login');
      expect(m.getDb).not.toHaveBeenCalled();
      expect(storeCalls()).toBe(0);
      expect(m.enforceRateLimit).not.toHaveBeenCalled();
      expect(m.audit).not.toHaveBeenCalled();
      expect(m.del).not.toHaveBeenCalled();
      expect(m.revalidatePath).not.toHaveBeenCalled();
    });
  }
});

describe('(b) rate limit', () => {
  for (const name of Object.keys(callers)) {
    it(`${name}: limited means an error, an audit row and no write`, async () => {
      m.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 30, response: new Response(null, { status: 429 }) });
      const result = (await callers[name]!()) as { error?: string };
      expect(result.error).toMatch(/Demasiados cambios/);
      expect(m.enforceRateLimit).toHaveBeenCalledWith('adminWrite', { adminId: ADMIN.id });
      expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'encargo.write_rate_limited', outcome: 'denied' }));
      expect(storeCalls()).toBe(0);
      expect(m.getDb).not.toHaveBeenCalled();
      expect(m.revalidatePath).not.toHaveBeenCalled();
    });
  }
});

describe('saving a section', () => {
  it('stores only true overrides, audits changed keys without values, and revalidates', async () => {
    const r = await actions.saveEncargoSectionAction({}, fd({ section: 'announcement', text: '  Promo  de   otoño ' }));
    expect(r).toEqual({ ok: true });
    const opts = m.store.writeSection.mock.calls[0]![0];
    expect(opts.section).toBe('announcement');
    expect(opts.adminId).toBe(ADMIN.id);
    expect(opts.update(undefined)).toEqual({ text: 'Promo de otoño' });
    expect(m.revalidatePath).toHaveBeenCalledWith('/encargo');
    expect(m.revalidatePath).toHaveBeenCalledWith('/admin/encargo');
  });
  it('audits encargo.content.update with section and field keys only', async () => {
    m.store.writeSection.mockResolvedValue({ before: undefined, after: { text: 'Secreto 123' }, removedUrls: [] });
    await actions.saveEncargoSectionAction({}, fd({ section: 'announcement', text: 'Secreto 123' }));
    const call = m.audit.mock.calls.find((c) => c[0].action === 'encargo.content.update')![0];
    expect(call).toMatchObject({ actorId: ADMIN.id, outcome: 'success', target: 'announcement', metadata: { section: 'announcement', fields: ['text'] } });
    expect(JSON.stringify(call)).not.toContain('Secreto 123');
  });
  it('drops values equal to the default (nothing stored)', async () => {
    await actions.saveEncargoSectionAction({}, fd({ section: 'announcement', text: encargo.announcement }));
    expect(m.store.writeSection.mock.calls[0]![0].update(undefined)).toBeUndefined();
  });
  it('requires alt text with an image', async () => {
    const r = await actions.saveEncargoSectionAction({}, fd({ section: 'hero', 'image.url': GOOD_URL, 'image.alt': '' }));
    expect(r.errors?.['image.alt']).toBeTruthy();
    expect(m.store.writeSection).not.toHaveBeenCalled();
    const ok = await actions.saveEncargoSectionAction({}, fd({ section: 'hero', 'image.url': GOOD_URL, 'image.alt': 'Persona con gorra' }));
    expect(ok).toEqual({ ok: true });
    expect(m.store.writeSection.mock.calls[0]![0].update(undefined)).toEqual({ image: { url: GOOD_URL, alt: 'Persona con gorra' } });
  });
  it('echoes the submitted values with field errors', async () => {
    const r = await actions.saveEncargoSectionAction({}, fd({ section: 'hero', title: 'x'.repeat(200) }));
    expect(r.errors?.title).toMatch(/máximo 90/);
    expect(r.values?.title).toHaveLength(200);
  });
  it('blob cleanup runs after the write with the removed urls', async () => {
    m.store.writeSection.mockResolvedValue({ before: {}, after: {}, removedUrls: [GOOD_URL] });
    await actions.saveEncargoSectionAction({}, fd({ section: 'announcement', text: 'Hola' }));
    expect(m.store.deleteUnreferencedBlobs).toHaveBeenCalledWith([GOOD_URL], HOST);
  });
});

describe('(c) mass assignment', () => {
  it('ignores sortOrder, id, updated_by, __proto__ and fields of other sections', async () => {
    const f = fd({
      section: 'announcement',
      text: 'Hola',
      sortOrder: '3',
      id: VALID_ID,
      updated_by: VALID_ID,
      __proto__: 'x',
      constructor: 'y',
      title: 'Del hero',
      'hero.title': 'Otro',
      data: '{"hero":{}}',
    });
    const r = await actions.saveEncargoSectionAction({}, f);
    expect(r).toEqual({ ok: true });
    const opts = m.store.writeSection.mock.calls[0]![0];
    expect(Object.keys(opts).sort()).toEqual(['adminId', 'host', 'section', 'update']);
    expect(opts.update(undefined)).toEqual({ text: 'Hola' });
    expect(opts.adminId).toBe(ADMIN.id);
  });
  it('rejects unknown or prototype-ish sections', async () => {
    for (const section of ['__proto__', 'constructor', 'toString', 'hero ', 'Hero', '', 'site_content', 'chrome']) {
      const r = await actions.saveEncargoSectionAction({}, fd({ section, text: 'Hola' }));
      expect(r.error).toBeTruthy();
    }
    expect(m.store.writeSection).not.toHaveBeenCalled();
  });
  it('project create ignores sortOrder and updated fields; values hold only editable fields', async () => {
    await expect(
      actions.saveEncargoProjectAction({}, fd({ ...validProject, sortOrder: '0', createdAt: '2020-01-01', visible: 'on', __proto__: 'x' })),
    ).rejects.toThrow('NEXT_REDIRECT:/admin/proyectos');
    const values = m.store.createProject.mock.calls[0]![0];
    expect(Object.keys(values).sort()).toEqual(
      ['colors', 'delivery', 'description', 'imageAlt', 'imageUrl', 'meta', 'minimum', 'name', 'tag', 'technique', 'techniqueDetail', 'visible'].sort(),
    );
    expect(values.visible).toBe(true);
    expect(m.store.updateProject).not.toHaveBeenCalled();
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'encargo.project.create', target: VALID_ID }));
  });
  it('project update takes the id from the form and audits update', async () => {
    await expect(actions.saveEncargoProjectAction({}, fd({ ...validProject, id: VALID_ID }))).rejects.toThrow('NEXT_REDIRECT');
    expect(m.store.updateProject).toHaveBeenCalledWith(VALID_ID, expect.objectContaining({ visible: false }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'encargo.project.update' }));
  });
});

const PAYLOADS = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  'a' + ch(0x202e) + 'b',
  'a' + ch(0x2066) + 'b',
  'a' + ch(0x200b) + 'b',
  'a`b',
  'a' + ch(0) + 'b',
];

describe('(d) XSS payloads are rejected in every text and alt field', () => {
  const skip = (name: string) => name.endsWith('.url') || name === 'enabled' || name === 'startsOn' || name === 'endsOn';
  for (const section of SECTION_KEYS as readonly SectionKey[]) {
    for (const name of SECTION_FIELD_NAMES[section]) {
      if (skip(name)) continue;
      it(`${section}.${name}`, async () => {
        for (const payload of PAYLOADS) {
          const form: Record<string, string> = { section, [name]: payload };
          if (name.endsWith('.alt')) form[name.replace(/\.alt$/, '.url')] = GOOD_URL;
          if (section === 'marquee') form.enabled = 'on';
          if (section === 'whatsapp' && name !== 'teamQuote') form[name] = `${payload} {name}`;
          const r = await actions.saveEncargoSectionAction({}, fd(form));
          expect(r.ok, `${section}.${name} accepted ${JSON.stringify(payload)}`).not.toBe(true);
          expect(r.errors?.[name]).toBeTruthy();
        }
        expect(m.store.writeSection).not.toHaveBeenCalled();
      });
    }
  }
  for (const field of ['name', 'tag', 'meta', 'description', 'techniqueDetail', 'minimum', 'colors', 'delivery', 'imageAlt']) {
    it(`project.${field}`, async () => {
      for (const payload of PAYLOADS) {
        const form = { ...validProject, [field]: payload, ...(field === 'imageAlt' ? { imageUrl: GOOD_URL } : {}) };
        const r = await actions.saveEncargoProjectAction({}, fd(form));
        expect(r.errors?.[field]).toBeTruthy();
      }
      expect(m.store.createProject).not.toHaveBeenCalled();
    });
  }
});

describe('(e) image URLs', () => {
  const bad = [
    'https://evil.com/encargo/a.jpg',
    `https://other.public.blob.vercel-storage.com/encargo/a.jpg`,
    `http://${HOST}/encargo/a.jpg`,
    `https://${HOST}/productos/a.jpg`,
    `https://user:pw@${HOST}/encargo/a.jpg`,
    `https://${HOST}:444/encargo/a.jpg`,
    `https://${HOST}/encargo/a.jpg?x=1`,
    `https://${HOST}/encargo/../productos/a.jpg`,
    'data:image/png;base64,AAAA',
    'blob:https://x/y',
    'javascript:alert(1)',
  ];
  it('hero image and project image reject every bad URL', async () => {
    for (const url of bad) {
      const r = await actions.saveEncargoSectionAction({}, fd({ section: 'hero', 'image.url': url, 'image.alt': 'Foto buena' }));
      expect(r.errors?.['image.url'], url).toBeTruthy();
      const p = await actions.saveEncargoProjectAction({}, fd({ ...validProject, imageUrl: url, imageAlt: 'Foto buena' }));
      expect(p.errors?.imageUrl, url).toBeTruthy();
    }
    expect(m.store.writeSection).not.toHaveBeenCalled();
    expect(m.store.createProject).not.toHaveBeenCalled();
  });
});

describe('(f) project ids', () => {
  const generic = /No se encontró el proyecto/;
  it('invalid ids give a generic error and no write', async () => {
    for (const id of ['nope', '', '1', "' OR 1=1 --", '../x', `${VALID_ID}x`]) {
      for (const act of [actions.toggleEncargoProjectVisibleAction, actions.deleteEncargoProjectAction]) {
        expect(((await act({}, fd({ id }))) as { error?: string }).error).toMatch(generic);
      }
      expect((await actions.moveEncargoProjectAction({}, fd({ id, direction: 'up' }))).error).toMatch(generic);
      if (id !== '') expect((await actions.saveEncargoProjectAction({}, fd({ ...validProject, id }))).error).toMatch(generic);
    }
    expect((await actions.moveEncargoProjectAction({}, fd({ id: VALID_ID, direction: 'sideways' }))).error).toMatch(generic);
    expect(m.store.toggleProjectVisible).not.toHaveBeenCalled();
    expect(m.store.deleteProject).not.toHaveBeenCalled();
    expect(m.store.moveProject).not.toHaveBeenCalled();
    expect(m.store.updateProject).not.toHaveBeenCalled();
    expect(m.store.createProject).not.toHaveBeenCalled();
  });
  it('unknown but valid ids give the same generic error, without DB detail', async () => {
    m.store.toggleProjectVisible.mockResolvedValue(false);
    m.store.moveProject.mockResolvedValue(false);
    m.store.deleteProject.mockResolvedValue({ error: 'not_found' });
    m.store.updateProject.mockResolvedValue(null);
    expect((await actions.toggleEncargoProjectVisibleAction({}, fd({ id: VALID_ID }))).error).toMatch(generic);
    expect((await actions.moveEncargoProjectAction({}, fd({ id: VALID_ID, direction: 'down' }))).error).toMatch(generic);
    expect((await actions.deleteEncargoProjectAction({}, fd({ id: VALID_ID }))).error).toMatch(generic);
    expect((await actions.saveEncargoProjectAction({}, fd({ ...validProject, id: VALID_ID }))).error).toMatch(generic);
    expect(m.audit).not.toHaveBeenCalledWith(expect.objectContaining({ action: expect.stringMatching(/^encargo\.project\./) }));
  });
  it('a DB failure returns the generic save error, never the exception text', async () => {
    m.store.toggleProjectVisible.mockRejectedValue(new Error('connection to 10.0.0.1 password=hunter2 failed'));
    const r = await actions.toggleEncargoProjectVisibleAction({}, fd({ id: VALID_ID }));
    expect(JSON.stringify(r)).not.toMatch(/hunter2|10\.0\.0\.1/);
    expect(r.error).toBeTruthy();
  });
  it('refuses to delete the last project and reports the project limit', async () => {
    m.store.deleteProject.mockResolvedValue({ error: 'last' });
    expect((await actions.deleteEncargoProjectAction({}, fd({ id: VALID_ID }))).error).toMatch(/último proyecto/);
    m.store.createProject.mockResolvedValue({ error: 'limit' });
    expect((await actions.saveEncargoProjectAction({}, fd(validProject))).error).toMatch(/24 proyectos/);
    expect(m.audit).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'encargo.project.create' }));
  });
});

describe('(g) restore', () => {
  it('rejects fields outside the section allowlist', async () => {
    const bad: [string, string][] = [
      ['hero', '__proto__'],
      ['hero', 'constructor'],
      ['hero', 'image.url'],
      ['hero', 'images.0'],
      ['queHacemos', 'images.3'],
      ['queHacemos', 'images.-1'],
      ['taller', 'stats.3'],
      ['tecnicas', 'items.0.id'],
      ['announcement', 'title'],
      ['announcement', '../hero'],
    ];
    for (const [section, field] of bad) {
      expect((await actions.restoreEncargoAction({}, fd({ section, field }))).error, `${section}/${field}`).toMatch(/No se puede restaurar/);
    }
    expect((await actions.restoreEncargoAction({}, fd({ section: 'nope', field: 'title' }))).error).toMatch(/No se puede restaurar/);
    const withFile = new FormData();
    withFile.set('section', 'hero');
    withFile.set('field', new File(['x'], 'x.txt'));
    expect((await actions.restoreEncargoAction({}, withFile)).error).toMatch(/No se puede restaurar/);
    expect(m.store.writeSection).not.toHaveBeenCalled();
  });
  it('restores one field, or the whole section without a field, and audits both', async () => {
    const section = { title: 'Nuevo', image: { url: GOOD_URL, alt: 'Foto' } };
    await actions.restoreEncargoAction({}, fd({ section: 'hero', field: 'image' }));
    expect(m.store.writeSection.mock.calls[0]![0].update(section)).toEqual({ title: 'Nuevo' });
    await actions.restoreEncargoAction({}, fd({ section: 'hero' }));
    expect(m.store.writeSection.mock.calls[1]![0].update(section)).toBeUndefined();
    const audits = m.audit.mock.calls.filter((c) => c[0].action === 'encargo.content.restore').map((c) => c[0].metadata);
    expect(audits).toEqual([
      { section: 'hero', field: 'image' },
      { section: 'hero', field: null },
    ]);
  });
  it('removing an array slot keeps the other slots', async () => {
    const q = { images: [{ url: GOOD_URL, alt: 'Uno' }, { url: GOOD_URL + 'b', alt: 'Dos' }] };
    await actions.restoreEncargoAction({}, fd({ section: 'queHacemos', field: 'images.0' }));
    expect(m.store.writeSection.mock.calls[0]![0].update(q)).toEqual({ images: [null, { url: GOOD_URL + 'b', alt: 'Dos' }] });
    await actions.restoreEncargoAction({}, fd({ section: 'queHacemos', field: 'images.1' }));
    expect(m.store.writeSection.mock.calls[1]![0].update(q)).toEqual({ images: [{ url: GOOD_URL, alt: 'Uno' }] });
  });
});

describe('B2: restoring marquee text', () => {
  it('also switches the promo off so the result stays valid', async () => {
    await actions.restoreEncargoAction({}, fd({ section: 'marquee', field: 'text' }));
    const update = m.store.writeSection.mock.calls[0]![0].update;
    expect(update({ enabled: true, text: 'Promo', startsOn: '2026-10-01' })).toEqual({ startsOn: '2026-10-01' });
  });
});

describe('(h) WhatsApp templates', () => {
  it('rejects a template without {name} or with other placeholders', async () => {
    for (const field of ['projectOrder', 'bulkQuote']) {
      for (const value of ['Hola sin nombre', 'Hola {other}', '{name} y {name}', 'Hola {name} {x}', 'Hola {name']) {
        const r = await actions.saveEncargoSectionAction({}, fd({ section: 'whatsapp', [field]: value }));
        expect(r.errors?.[field], `${field}: ${value}`).toBeTruthy();
      }
    }
    expect(m.store.writeSection).not.toHaveBeenCalled();
    const ok = await actions.saveEncargoSectionAction({}, fd({ section: 'whatsapp', projectOrder: 'Hola, quiero "{name}".', teamQuote: 'Hola equipo' }));
    expect(ok).toEqual({ ok: true });
  });
});

describe('other actions', () => {
  it('toggle, move, delete and import write audit rows with the project id as target', async () => {
    await actions.toggleEncargoProjectVisibleAction({}, fd({ id: VALID_ID }));
    await actions.moveEncargoProjectAction({}, fd({ id: VALID_ID, direction: 'down' }));
    await actions.deleteEncargoProjectAction({}, fd({ id: VALID_ID }));
    await actions.importDefaultProjectsAction();
    const seen = m.audit.mock.calls.map((c) => [c[0].action, c[0].target]);
    expect(seen).toEqual([
      ['encargo.project.toggle_visibility', VALID_ID],
      ['encargo.project.reorder', VALID_ID],
      ['encargo.project.delete', VALID_ID],
      ['encargo.project.import', null],
    ]);
  });
  it('deletes the old project image only through the referenced-check helper', async () => {
    m.store.updateProject.mockResolvedValue({ previousImage: GOOD_URL });
    await expect(actions.saveEncargoProjectAction({}, fd({ ...validProject, id: VALID_ID }))).rejects.toThrow('NEXT_REDIRECT');
    expect(m.store.deleteUnreferencedBlobs).toHaveBeenCalledWith([GOOD_URL], HOST);
    expect(m.del).not.toHaveBeenCalled();
  });
});
