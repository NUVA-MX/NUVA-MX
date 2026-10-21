'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { admin as copy } from '@/content/admin';
import { getAdmin, isAdminEmail, missingAdminEnv, requireAdmin } from '@/lib/auth/admin';
import { normalizeEmail } from '@/lib/auth/emails';
import { verifyAgainstDummy, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';
import { blobPublicHost } from '@/lib/blob';
import { getDb } from '@/lib/db/client';
import { adminUsers, products } from '@/lib/db/schema';
import { readProductForm, uuidSchema, type ProductFormField } from '@/lib/products/validation';
import { audit } from '@/server/audit/audit';
import { deleteUnreferencedBlobs } from '@/server/content/blob-cleanup';
import { blobToken, getEnv } from '@/server/env';
import { hashIdentifier } from '@/server/http/hash';
import { currentContext } from '@/server/http/next-context';
import { log } from '@/server/log/logger';
import { checkRateLimit, enforceRateLimit } from '@/server/ratelimit/guard';

/*
 * Account lockout: 5 failed passwords lock the account for 15 minutes.
 * Accepted trade-off (review 1, bug 4): someone who knows an admin email can keep that account
 * locked by failing on purpose. We keep per-account locking because it is what stops password
 * guessing; per-IP+account locking would need a new table and trusting proxy IP headers, and
 * distributed guessing would then go unthrottled. Impact is limited: sessions already open keep
 * working, other admins are unaffected, and `npm run admin:create` clears the lock immediately.
 */
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type LoginState = { error?: string };

const loginSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  password: z.string().min(1).max(200),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (missingAdminEnv().length > 0) return { error: copy.login.error };

  const ctx = await currentContext();
  const auditBase = { actorType: 'admin' as const, ip: ctx.ip, requestId: ctx.requestId };

  // Rate limit first: every attempt counts per IP; the per-email limit only counts failures (checked
  // here, consumed in `failed()` below), so successful logins never lock an email. On limit, show the
  // generic error so the limit itself reveals nothing about accounts.
  const rawEmail = formData.get('email');
  const emailKey = typeof rawEmail === 'string' ? normalizeEmail(rawEmail.slice(0, 254)) : '';
  const emailIds = { emailHash: emailKey ? hashIdentifier(emailKey, getEnv().auditIpSalt ?? 'nuva-login') : undefined };
  const limited = await enforceRateLimit('login', { ip: ctx.ip });
  const emailLimited = limited.ok ? await checkRateLimit('loginFailures', emailIds) : limited;
  if (!limited.ok || !emailLimited.ok) {
    await audit({ ...auditBase, action: 'auth.login_rate_limited', outcome: 'denied' });
    return { error: copy.login.error };
  }
  const failed = async () => {
    await enforceRateLimit('loginFailures', emailIds);
    return { error: copy.login.error };
  };

  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: copy.login.invalid };

  const email = normalizeEmail(parsed.data.email);
  const { password } = parsed.data;
  const db = getDb();

  // The email must be in ADMIN_EMAILS even if the user exists in the database.
  const [user] = isAdminEmail(email)
    ? await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)
    : [];

  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) {
    await verifyAgainstDummy(password);
    await audit({
      ...auditBase,
      actorId: user?.id ?? null,
      action: user ? 'auth.login_locked' : 'auth.login',
      outcome: user ? 'denied' : 'failure',
      metadata: { reason: user ? 'account_locked' : 'unknown_or_not_allowed' },
    });
    return failed();
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const [row] = await db
      .update(adminUsers)
      .set({ failedAttempts: sql`${adminUsers.failedAttempts} + 1` })
      .where(eq(adminUsers.id, user.id))
      .returning({ attempts: adminUsers.failedAttempts });
    await audit({
      ...auditBase,
      actorId: user.id,
      action: 'auth.login',
      outcome: 'failure',
      metadata: { reason: 'bad_password', attempts: row?.attempts },
    });
    if (row && row.attempts >= MAX_ATTEMPTS) {
      await db
        .update(adminUsers)
        .set({ failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) })
        .where(eq(adminUsers.id, user.id));
      await audit({ ...auditBase, actorId: user.id, action: 'auth.account_locked', outcome: 'denied', metadata: { minutes: LOCK_MINUTES } });
    }
    return failed();
  }

  await db.update(adminUsers).set({ failedAttempts: 0, lockedUntil: null }).where(eq(adminUsers.id, user.id));
  await createSession(user.id);
  await audit({ ...auditBase, actorId: user.id, action: 'auth.login', outcome: 'success' });
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  const admin = await getAdmin();
  await deleteSession();
  if (admin) {
    const ctx = await currentContext();
    await audit({ actorType: 'admin', actorId: admin.id, action: 'auth.logout', outcome: 'success', ip: ctx.ip, requestId: ctx.requestId });
  }
  redirect('/admin/login');
}

export type ProductFormState = {
  errors?: Partial<Record<ProductFormField | 'form', string>>;
  /** Submitted values, echoed back so the form keeps them after a validation error. */
  values?: Partial<Record<ProductFormField, string>>;
};

function echoValues(formData: FormData): ProductFormState['values'] {
  const keys: ProductFormField[] = ['name', 'meta', 'price', 'stock', 'category', 'imageAlt', 'sortOrder'];
  const values: ProductFormState['values'] = { visible: formData.get('visible') === 'on' ? 'on' : '' };
  for (const k of keys) {
    const v = formData.get(k);
    values[k] = typeof v === 'string' ? v.slice(0, 500) : '';
  }
  return values;
}

const fieldErrors: Partial<Record<ProductFormField, string>> = {
  name: copy.form.errors.name,
  price: copy.form.errors.price,
  stock: copy.form.errors.stock,
  sortOrder: copy.form.errors.sortOrder,
  imageUrl: copy.form.errors.image,
};

/** Shared `adminWrite` limit for product writes. When limited: audit `product.write_rate_limited`, no write. */
async function writeAllowed(adminId: string, ctx: { ip: string; requestId: string }): Promise<boolean> {
  const limited = await enforceRateLimit('adminWrite', { adminId });
  if (limited.ok) return true;
  await audit({ actorType: 'admin', actorId: adminId, action: 'product.write_rate_limited', outcome: 'denied', ip: ctx.ip, requestId: ctx.requestId });
  return false;
}

/** Product blob cleanup: only `productos/` blobs on our host that no table references anymore. */
async function deleteBlob(url: string | null | undefined) {
  await deleteUnreferencedBlobs([url], blobPublicHost(blobToken()), 'productos');
}

/** Creates (no id) or updates (id) a product. */
export async function saveProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const admin = await requireAdmin();
  const ctx = await currentContext();
  if (!(await writeAllowed(admin.id, ctx))) return { errors: { form: copy.form.errors.rateLimited }, values: echoValues(formData) };

  const parsed = readProductForm(formData, { imageHost: blobPublicHost(blobToken()) });
  if (!parsed.success) {
    const errors: ProductFormState['errors'] = { form: copy.form.errors.generic };
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ProductFormField;
      if (key && !errors[key]) errors[key] = fieldErrors[key] ?? copy.form.errors.generic;
    }
    return { errors, values: echoValues(formData) };
  }

  const values = parsed.data;
  const db = getDb();
  const rawId = formData.get('id');
  let replacedImage: string | null = null;
  let savedId: string | null = null;
  let isUpdate = false;

  try {
    if (typeof rawId === 'string' && rawId !== '') {
      const id = uuidSchema.safeParse(rawId);
      if (!id.success) return { errors: { form: copy.form.errors.notFound }, values: echoValues(formData) };
      const [previous] = await db.select({ imageUrl: products.imageUrl }).from(products).where(eq(products.id, id.data));
      if (!previous) return { errors: { form: copy.form.errors.notFound }, values: echoValues(formData) };
      await db.update(products).set(values).where(eq(products.id, id.data));
      savedId = id.data;
      isUpdate = true;
      if (previous.imageUrl && previous.imageUrl !== values.imageUrl) replacedImage = previous.imageUrl;
    } else {
      const [created] = await db.insert(products).values(values).returning({ id: products.id });
      savedId = created?.id ?? null;
    }
  } catch (err) {
    // Validation should prevent this; if the DB still rejects the row, keep the form and its values.
    log.error('admin.product_save_failed', { requestId: ctx.requestId, error: err });
    return { errors: { form: copy.form.errors.save }, values: echoValues(formData) };
  }

  await audit({
    actorType: 'admin',
    actorId: admin.id,
    action: isUpdate ? 'product.update' : 'product.create',
    target: savedId,
    outcome: 'success',
    ip: ctx.ip,
    requestId: ctx.requestId,
  });
  await deleteBlob(replacedImage);
  revalidatePath('/admin');
  redirect('/admin');
}

export async function toggleVisibleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const ctx = await currentContext();
  if (!(await writeAllowed(admin.id, ctx))) return;
  const id = uuidSchema.safeParse(formData.get('id'));
  if (!id.success) return;
  try {
    await getDb()
      .update(products)
      .set({ visible: sql`not ${products.visible}` })
      .where(eq(products.id, id.data));
  } catch (err) {
    log.error('admin.toggle_visible_failed', { requestId: ctx.requestId, error: err });
    return;
  }
  await audit({ actorType: 'admin', actorId: admin.id, action: 'product.toggle_visibility', target: id.data, outcome: 'success', ip: ctx.ip, requestId: ctx.requestId });
  revalidatePath('/admin');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const ctx = await currentContext();
  if (!(await writeAllowed(admin.id, ctx))) return;
  const id = uuidSchema.safeParse(formData.get('id'));
  if (!id.success) return;
  let deleted: { imageUrl: string | null } | undefined;
  try {
    [deleted] = await getDb()
      .delete(products)
      .where(eq(products.id, id.data))
      .returning({ imageUrl: products.imageUrl });
  } catch (err) {
    log.error('admin.product_delete_failed', { requestId: ctx.requestId, error: err });
    return;
  }
  if (deleted) {
    await audit({ actorType: 'admin', actorId: admin.id, action: 'product.delete', target: id.data, outcome: 'success', ip: ctx.ip, requestId: ctx.requestId });
  }
  await deleteBlob(deleted?.imageUrl);
  revalidatePath('/admin');
}
