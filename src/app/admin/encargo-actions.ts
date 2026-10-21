'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { adminEncargo as copy } from '@/content/admin-encargo';
import { encargo as defaults } from '@/content/encargo';
import { requireAdmin } from '@/lib/auth/admin';
import { blobPublicHost } from '@/lib/blob';
import { overrideDefaults } from '@/lib/content/encargo-merge';
import {
  buildProjectCandidate,
  buildSectionCandidate,
  diffPaths,
  issuesToErrors,
  pruneDefaults,
  readProjectRaw,
  readSectionRaw,
  removeOverridePath,
  type EncargoActionState,
} from '@/lib/content/encargo-form';
import { isRestorePath, projectIdSchema, projectSchema, sectionKeySchema, sectionSchemas } from '@/lib/content/encargo-schema';
import { MAX_PROJECTS } from '@/lib/content/limits';
import { fillTemplate } from '@/lib/format';
import { audit } from '@/server/audit/audit';
import {
  ContentInvalidError,
  createProject,
  deleteProject,
  deleteUnreferencedBlobs,
  importDefaultProjects,
  moveProject,
  toggleProjectVisible,
  updateProject,
  writeSection,
} from '@/server/content/encargo-store';
import { blobToken } from '@/server/env';
import { currentContext } from '@/server/http/next-context';
import { log } from '@/server/log/logger';
import { enforceRateLimit } from '@/server/ratelimit/guard';

/*
 * Every exported function here is a public HTTP endpoint (server actions can be called directly), so each one
 * follows the same sequence: requireAdmin() first, then the adminWrite rate limit, then strict parsing, the
 * write, audit, and revalidation. This file exports nothing else: helpers stay private.
 */

type Admin = { id: string };
type Ctx = { ip: string; requestId: string };

/** Rate limit gate shared by every action. On limit: audit `encargo.write_rate_limited` and return the error state. */
async function gateWrite(admin: Admin): Promise<{ ok: true; ctx: Ctx } | { ok: false; state: EncargoActionState }> {
  const ctx = await currentContext();
  const limited = await enforceRateLimit('adminWrite', { adminId: admin.id });
  if (limited.ok) return { ok: true, ctx };
  await audit({
    actorType: 'admin',
    actorId: admin.id,
    action: 'encargo.write_rate_limited',
    outcome: 'denied',
    ip: ctx.ip,
    requestId: ctx.requestId,
  });
  return { ok: false, state: { error: copy.errors.rateLimited } };
}

function record(admin: Admin, ctx: Ctx, action: string, target: string | null, metadata?: Record<string, unknown>) {
  return audit({
    actorType: 'admin',
    actorId: admin.id,
    action,
    target,
    outcome: 'success',
    ip: ctx.ip,
    requestId: ctx.requestId,
    metadata,
  });
}

function refresh() {
  revalidatePath('/encargo');
  revalidatePath('/admin/encargo');
  revalidatePath('/admin/proyectos');
}

function imageHost() {
  return blobPublicHost(blobToken());
}

/** Saves one section of the page content. Only that section's known fields are read from the form. */
export async function saveEncargoSectionAction(_prev: EncargoActionState, formData: FormData): Promise<EncargoActionState> {
  const admin = await requireAdmin();
  const gate = await gateWrite(admin);
  if (!gate.ok) return gate.state;

  const parsedSection = sectionKeySchema.safeParse(formData.get('section'));
  if (!parsedSection.success) return { error: copy.errors.generic };
  const section = parsedSection.data;
  const host = imageHost();

  const raw = readSectionRaw(section, formData);
  const parsed = sectionSchemas(host)[section].safeParse(buildSectionCandidate(section, raw));
  if (!parsed.success) return { errors: issuesToErrors(parsed.error.issues), values: raw };
  const overridesOnly = pruneDefaults(parsed.data, overrideDefaults(defaults)[section]);

  let result;
  try {
    result = await writeSection({ section, adminId: admin.id, host, update: () => overridesOnly });
  } catch (err) {
    if (!(err instanceof ContentInvalidError)) log.error('encargo.content_save_failed', { requestId: gate.ctx.requestId, error: err });
    return { error: copy.errors.save, values: raw };
  }

  await record(admin, gate.ctx, 'encargo.content.update', section, { section, fields: diffPaths(result.before, result.after) });
  await deleteUnreferencedBlobs(result.removedUrls, host);
  refresh();
  return { ok: true };
}

/** Restores one field (`field` = an allowlisted override path) or a whole section (no `field`) to the defaults. */
export async function restoreEncargoAction(_prev: EncargoActionState, formData: FormData): Promise<EncargoActionState> {
  const admin = await requireAdmin();
  const gate = await gateWrite(admin);
  if (!gate.ok) return gate.state;

  const parsedSection = sectionKeySchema.safeParse(formData.get('section'));
  if (!parsedSection.success) return { error: copy.errors.restoreInvalid };
  const section = parsedSection.data;
  const rawField = formData.get('field');
  if (rawField !== null && typeof rawField !== 'string') return { error: copy.errors.restoreInvalid };
  const field = rawField === null || rawField === '' ? null : rawField;
  if (field !== null && !isRestorePath(section, field)) return { error: copy.errors.restoreInvalid };

  const host = imageHost();
  let result;
  try {
    result = await writeSection({
      section,
      adminId: admin.id,
      host,
      update: (current) => {
        if (field === null || current === undefined) return undefined;
        let next = removeOverridePath(current, field);
        // A promo cannot stay enabled without its text: restoring the text switches it off too.
        if (section === 'marquee' && field === 'text') next = removeOverridePath(next, 'enabled');
        return next;
      },
    });
  } catch (err) {
    if (!(err instanceof ContentInvalidError)) log.error('encargo.content_restore_failed', { requestId: gate.ctx.requestId, error: err });
    return { error: copy.errors.save };
  }

  await record(admin, gate.ctx, 'encargo.content.restore', section, { section, field });
  await deleteUnreferencedBlobs(result.removedUrls, host);
  refresh();
  return { ok: true };
}

/** Creates (no `id`) or updates (`id`) a project, then returns to the list. */
export async function saveEncargoProjectAction(_prev: EncargoActionState, formData: FormData): Promise<EncargoActionState> {
  const admin = await requireAdmin();
  const gate = await gateWrite(admin);
  if (!gate.ok) return gate.state;

  const host = imageHost();
  const raw = readProjectRaw(formData);
  const parsed = projectSchema(host).safeParse(buildProjectCandidate(raw));
  if (!parsed.success) return { errors: issuesToErrors(parsed.error.issues), values: raw };

  const rawId = formData.get('id');
  let id: string | null = null;
  if (rawId !== null && rawId !== '') {
    const checked = projectIdSchema.safeParse(rawId);
    if (!checked.success) return { error: copy.errors.notFound, values: raw };
    id = checked.data;
  }

  let savedId: string;
  let replacedImage: string | null = null;
  try {
    if (id === null) {
      const created = await createProject(parsed.data);
      if ('error' in created) return { error: fillTemplate(copy.errors.projectLimit, { max: MAX_PROJECTS }), values: raw };
      savedId = created.id;
    } else {
      const updated = await updateProject(id, parsed.data);
      if (!updated) return { error: copy.errors.notFound, values: raw };
      savedId = id;
      if (updated.previousImage && updated.previousImage !== parsed.data.imageUrl) replacedImage = updated.previousImage;
    }
  } catch (err) {
    log.error('encargo.project_save_failed', { requestId: gate.ctx.requestId, error: err });
    return { error: copy.errors.save, values: raw };
  }

  await record(admin, gate.ctx, id === null ? 'encargo.project.create' : 'encargo.project.update', savedId);
  await deleteUnreferencedBlobs([replacedImage], host);
  refresh();
  redirect('/admin/proyectos');
}

export async function toggleEncargoProjectVisibleAction(_prev: EncargoActionState, formData: FormData): Promise<EncargoActionState> {
  const admin = await requireAdmin();
  const gate = await gateWrite(admin);
  if (!gate.ok) return gate.state;
  const id = projectIdSchema.safeParse(formData.get('id'));
  if (!id.success) return { error: copy.errors.notFound };
  try {
    if (!(await toggleProjectVisible(id.data))) return { error: copy.errors.notFound };
  } catch (err) {
    log.error('encargo.project_toggle_failed', { requestId: gate.ctx.requestId, error: err });
    return { error: copy.errors.save };
  }
  await record(admin, gate.ctx, 'encargo.project.toggle_visibility', id.data);
  refresh();
  return { ok: true };
}

const directionSchema = z.enum(['up', 'down']);

export async function moveEncargoProjectAction(_prev: EncargoActionState, formData: FormData): Promise<EncargoActionState> {
  const admin = await requireAdmin();
  const gate = await gateWrite(admin);
  if (!gate.ok) return gate.state;
  const id = projectIdSchema.safeParse(formData.get('id'));
  const direction = directionSchema.safeParse(formData.get('direction'));
  if (!id.success || !direction.success) return { error: copy.errors.notFound };
  try {
    if (!(await moveProject(id.data, direction.data))) return { error: copy.errors.notFound };
  } catch (err) {
    log.error('encargo.project_move_failed', { requestId: gate.ctx.requestId, error: err });
    return { error: copy.errors.save };
  }
  await record(admin, gate.ctx, 'encargo.project.reorder', id.data, { direction: direction.data });
  refresh();
  return { ok: true };
}

export async function deleteEncargoProjectAction(_prev: EncargoActionState, formData: FormData): Promise<EncargoActionState> {
  const admin = await requireAdmin();
  const gate = await gateWrite(admin);
  if (!gate.ok) return gate.state;
  const id = projectIdSchema.safeParse(formData.get('id'));
  if (!id.success) return { error: copy.errors.notFound };
  let deleted;
  try {
    deleted = await deleteProject(id.data);
  } catch (err) {
    log.error('encargo.project_delete_failed', { requestId: gate.ctx.requestId, error: err });
    return { error: copy.errors.save };
  }
  if ('error' in deleted) return { error: deleted.error === 'last' ? copy.errors.lastProject : copy.errors.notFound };
  await record(admin, gate.ctx, 'encargo.project.delete', id.data);
  await deleteUnreferencedBlobs([deleted.imageUrl], imageHost());
  refresh();
  return { ok: true };
}

export async function importDefaultProjectsAction(): Promise<EncargoActionState> {
  const admin = await requireAdmin();
  const gate = await gateWrite(admin);
  if (!gate.ok) return gate.state;
  let inserted: number;
  try {
    inserted = await importDefaultProjects();
  } catch (err) {
    log.error('encargo.project_import_failed', { requestId: gate.ctx.requestId, error: err });
    return { error: copy.errors.save };
  }
  await record(admin, gate.ctx, 'encargo.project.import', null, { inserted });
  refresh();
  return { ok: true };
}
