import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { MAX_PROJECTS } from '@/lib/content/limits';
import {
  collectImageUrls,
  sanitizeOverrides,
  type EncargoOverrides,
  type ProjectValues,
  type SectionKey,
} from '@/lib/content/encargo-schema';
import { defaultProjectRows } from '@/lib/content/seed-projects';
import { getDb } from '@/lib/db/client';
import { encargoProjects, siteContent, type EncargoProjectRow } from '@/lib/db/schema';
import { deleteUnreferencedBlobs as deleteUnreferenced } from './blob-cleanup';
import { log } from '@/server/log/logger';

const KEY = 'encargo' as const;

/** Thrown when a write would leave the stored document invalid. Never carries DB detail. */
export class ContentInvalidError extends Error {
  constructor() {
    super('content_invalid');
  }
}

/** Serializes every project write (count checks, reorder, delete-last) across instances. */
async function lockProjects(tx: Pick<ReturnType<typeof getDb>, 'execute'>) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('encargo_projects'))`);
}

// ---- Content --------------------------------------------------------------------------------------------

/** Stored overrides for the admin page (invalid sections are dropped and logged, like on the public page). */
export async function readOverridesForAdmin(host: string | null): Promise<{ overrides: EncargoOverrides; updatedAt: Date | null }> {
  const [row] = await getDb().select().from(siteContent).where(eq(siteContent.key, KEY)).limit(1);
  const { overrides, invalid } = sanitizeOverrides(row?.data ?? null, host);
  for (const section of invalid) log.error('encargo.content_invalid', { section });
  return { overrides, updatedAt: row?.updatedAt ?? null };
}

export type SectionWrite = {
  before: unknown;
  after: unknown;
  /** Image URLs that were in the old section value and are not in the new one (deletion candidates). */
  removedUrls: string[];
};

/**
 * Replaces one section of the stored document under a row lock.
 * `update` receives the current (validated) section value and returns the new one (undefined removes it).
 * Other sections that fail validation are dropped (they already fall back to defaults on the page).
 */
export async function writeSection(opts: {
  section: SectionKey;
  adminId: string;
  host: string | null;
  update: (current: unknown) => unknown;
}): Promise<SectionWrite> {
  return getDb().transaction(async (tx) => {
    await tx.insert(siteContent).values({ key: KEY, data: {} }).onConflictDoNothing();
    const [row] = await tx.select().from(siteContent).where(eq(siteContent.key, KEY)).for('update');
    const { overrides: current } = sanitizeOverrides(row?.data ?? null, opts.host);
    const before = current[opts.section];
    const next = opts.update(before);
    const doc: Record<string, unknown> = { ...current };
    if (next === undefined) delete doc[opts.section];
    else doc[opts.section] = next;
    const checked = sanitizeOverrides(doc, opts.host);
    if (checked.invalid.length > 0) throw new ContentInvalidError();
    await tx
      .update(siteContent)
      .set({ data: checked.overrides, updatedBy: opts.adminId, updatedAt: new Date() })
      .where(eq(siteContent.key, KEY));
    const after = checked.overrides[opts.section];
    const keep = new Set(collectImageUrls({ [opts.section]: after } as EncargoOverrides));
    const removedUrls = collectImageUrls({ [opts.section]: before } as EncargoOverrides).filter((u) => !keep.has(u));
    return { before, after, removedUrls };
  });
}

/** Deletes replaced `/encargo/` blobs that nothing references anymore (see blob-cleanup.ts). */
export async function deleteUnreferencedBlobs(candidates: readonly (string | null | undefined)[], host: string | null): Promise<void> {
  await deleteUnreferenced(candidates, host, 'encargo');
}

// ---- Projects -------------------------------------------------------------------------------------------

export async function listProjectsForAdmin(): Promise<EncargoProjectRow[]> {
  return getDb().select().from(encargoProjects).orderBy(asc(encargoProjects.sortOrder), asc(encargoProjects.createdAt)).limit(100);
}

export async function getProjectForAdmin(id: string): Promise<EncargoProjectRow | null> {
  const [row] = await getDb().select().from(encargoProjects).where(eq(encargoProjects.id, id)).limit(1);
  return row ?? null;
}

export async function createProject(values: ProjectValues): Promise<{ id: string } | { error: 'limit' }> {
  return getDb().transaction(async (tx) => {
    await lockProjects(tx);
    const [stats] = await tx
      .select({ n: sql<number>`count(*)::int`, max: sql<number | null>`max(${encargoProjects.sortOrder})` })
      .from(encargoProjects);
    if ((stats?.n ?? 0) >= MAX_PROJECTS) return { error: 'limit' as const };
    const [row] = await tx
      .insert(encargoProjects)
      .values({ ...values, sortOrder: (stats?.max ?? -1) + 1 })
      .returning({ id: encargoProjects.id });
    return { id: row!.id };
  });
}

/** Updates the editable fields only. Returns the previous image URL, or null when the project does not exist. */
export async function updateProject(id: string, values: ProjectValues): Promise<{ previousImage: string | null } | null> {
  return getDb().transaction(async (tx) => {
    const [previous] = await tx
      .select({ imageUrl: encargoProjects.imageUrl })
      .from(encargoProjects)
      .where(eq(encargoProjects.id, id))
      .for('update');
    if (!previous) return null;
    await tx
      .update(encargoProjects)
      .set({
        name: values.name,
        technique: values.technique,
        tag: values.tag,
        meta: values.meta,
        description: values.description,
        techniqueDetail: values.techniqueDetail,
        minimum: values.minimum,
        colors: values.colors,
        delivery: values.delivery,
        imageUrl: values.imageUrl,
        imageAlt: values.imageAlt,
        visible: values.visible,
      })
      .where(eq(encargoProjects.id, id));
    return { previousImage: previous.imageUrl };
  });
}

export async function toggleProjectVisible(id: string): Promise<boolean> {
  const rows = await getDb()
    .update(encargoProjects)
    .set({ visible: sql`not ${encargoProjects.visible}` })
    .where(eq(encargoProjects.id, id))
    .returning({ id: encargoProjects.id });
  return rows.length > 0;
}

/** Swaps the project with its neighbor. No-op (still true) at the edges; false when the id does not exist. */
export async function moveProject(id: string, direction: 'up' | 'down'): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    await lockProjects(tx);
    const rows = await tx
      .select({ id: encargoProjects.id, sortOrder: encargoProjects.sortOrder })
      .from(encargoProjects)
      .orderBy(asc(encargoProjects.sortOrder), asc(encargoProjects.createdAt), asc(encargoProjects.id));
    const from = rows.findIndex((r) => r.id === id);
    if (from === -1) return false;
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= rows.length) return true;
    const order = rows.map((r) => r.id);
    [order[from], order[to]] = [order[to]!, order[from]!];
    // Renumber 0..n-1 so ties or gaps in old data cannot break the swap.
    for (const [position, rowId] of order.entries()) {
      const current = rows.find((r) => r.id === rowId)!;
      if (current.sortOrder !== position) {
        await tx.update(encargoProjects).set({ sortOrder: position }).where(eq(encargoProjects.id, rowId));
      }
    }
    return true;
  });
}

export async function deleteProject(id: string): Promise<{ imageUrl: string | null } | { error: 'last' | 'not_found' }> {
  return getDb().transaction(async (tx) => {
    await lockProjects(tx);
    const [stats] = await tx.select({ n: sql<number>`count(*)::int` }).from(encargoProjects);
    const [target] = await tx
      .select({ imageUrl: encargoProjects.imageUrl })
      .from(encargoProjects)
      .where(eq(encargoProjects.id, id))
      .for('update');
    if (!target) return { error: 'not_found' as const };
    if ((stats?.n ?? 0) <= 1) return { error: 'last' as const };
    await tx.delete(encargoProjects).where(eq(encargoProjects.id, id));
    return { imageUrl: target.imageUrl };
  });
}

/** Inserts the 6 hard-coded projects only when the table is empty. Returns how many were inserted. */
export async function importDefaultProjects(): Promise<number> {
  return getDb().transaction(async (tx) => {
    await lockProjects(tx);
    const [stats] = await tx.select({ n: sql<number>`count(*)::int` }).from(encargoProjects);
    if ((stats?.n ?? 0) > 0) return 0;
    const rows = defaultProjectRows();
    await tx.insert(encargoProjects).values(rows);
    return rows.length;
  });
}
