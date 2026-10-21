import { beforeEach, describe, expect, it, vi } from 'vitest';

const HOST = 'abc123.public.blob.vercel-storage.com';
const ENC = `https://${HOST}/encargo/live-hero.jpg`;
const PROD = `https://${HOST}/productos/live-cap.jpg`;

const m = vi.hoisted(() => ({ del: vi.fn(), getDb: vi.fn(), content: [] as unknown[], productRows: [] as unknown[], projectRows: [] as unknown[] }));
vi.mock('@vercel/blob', () => ({ del: m.del }));
vi.mock('@/lib/db/client', () => ({ getDb: m.getDb }));
vi.mock('@/server/env', () => ({ blobToken: () => 'vercel_blob_rw_abc123_secretsecret', getEnvSafe: () => null, liveSecretValues: () => [] }));

import { products, encargoProjects } from '@/lib/db/schema';
import { deleteUnreferencedBlobs } from '../blob-cleanup';

beforeEach(() => {
  m.del.mockReset();
  m.content = [];
  m.productRows = [];
  m.projectRows = [];
  m.getDb.mockReturnValue({
    select: () => ({
      from: (t: unknown) => {
        const rows = t === products ? m.productRows : t === encargoProjects ? m.projectRows : m.content;
        const p = Promise.resolve(rows) as Promise<unknown[]> & { where: () => { limit: () => Promise<unknown[]> } };
        p.where = () => ({ limit: async () => rows });
        return p;
      },
    }),
  });
});

describe('deleteUnreferencedBlobs', () => {
  it('deletes an unreferenced blob in its own folder', async () => {
    await deleteUnreferencedBlobs([ENC], HOST, 'encargo');
    expect(m.del).toHaveBeenCalledWith(ENC);
  });
  it('keeps a blob referenced by site_content, a project or a product', async () => {
    m.content = [{ data: { hero: { image: { url: ENC, alt: 'x' } } } }];
    await deleteUnreferencedBlobs([ENC], HOST, 'encargo');
    m.content = [];
    m.projectRows = [{ url: ENC }];
    await deleteUnreferencedBlobs([ENC], HOST, 'encargo');
    m.projectRows = [];
    m.productRows = [{ url: ENC }];
    await deleteUnreferencedBlobs([ENC], HOST, 'encargo');
    expect(m.del).not.toHaveBeenCalled();
  });
  it('compares canonical forms: a non-canonical candidate cannot delete a live blob', async () => {
    m.content = [{ data: { hero: { image: { url: ENC, alt: 'x' } } } }];
    await deleteUnreferencedBlobs([`HTTPS://${HOST.toUpperCase()}/encargo/live-hero.jpg`, `${ENC}:443`.replace('.jpg:443', '.jpg')], HOST, 'encargo');
    expect(m.del).not.toHaveBeenCalled();
  });
  it('a stored non-canonical reference still protects the canonical blob', async () => {
    m.projectRows = [{ url: `HTTPS://${HOST.toUpperCase()}/encargo/live-hero.jpg` }];
    await deleteUnreferencedBlobs([ENC], HOST, 'encargo');
    expect(m.del).not.toHaveBeenCalled();
  });
  it('each side only deletes its own folder (S3)', async () => {
    await deleteUnreferencedBlobs([PROD], HOST, 'encargo');
    await deleteUnreferencedBlobs([ENC], HOST, 'productos');
    expect(m.del).not.toHaveBeenCalled();
    await deleteUnreferencedBlobs([PROD], HOST, 'productos');
    expect(m.del).toHaveBeenCalledWith(PROD);
  });
  it('ignores foreign hosts and a missing host', async () => {
    await deleteUnreferencedBlobs(['https://evil.com/encargo/a.jpg', ENC], null, 'encargo');
    await deleteUnreferencedBlobs(['https://evil.com/encargo/a.jpg'], HOST, 'encargo');
    expect(m.del).not.toHaveBeenCalled();
  });
  it('never throws when the DB fails', async () => {
    m.getDb.mockImplementation(() => {
      throw new Error('db down');
    });
    await expect(deleteUnreferencedBlobs([ENC], HOST, 'encargo')).resolves.toBeUndefined();
  });
});
