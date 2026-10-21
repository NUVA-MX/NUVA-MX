import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { isDbConfigured } from '@/lib/db/config';
import { adminEmailsRaw } from '@/server/env';
import { log } from '@/server/log/logger';
import { isEmailAllowed, parseAdminEmails } from './emails';
import { readSession, type SessionUser } from './session';

/** True if the email (any case) is listed in ADMIN_EMAILS. Read on every call, so removing it revokes access. */
export function isAdminEmail(email: string): boolean {
  return isEmailAllowed(email, adminEmailsRaw());
}

/** Names (never values) of the env vars the admin needs and are missing. */
export function missingAdminEnv(): string[] {
  const missing: string[] = [];
  if (!isDbConfigured()) missing.push('DATABASE_URL');
  if (parseAdminEmails(adminEmailsRaw()).length === 0) missing.push('ADMIN_EMAILS');
  return missing;
}

/** Current admin, or null. Checks session, expiry and that the email is still allowed. */
export const getAdmin = cache(async (): Promise<SessionUser | null> => {
  if (missingAdminEnv().length > 0) return null;
  try {
    const user = await readSession();
    if (!user || !isAdminEmail(user.email)) return null;
    return user;
  } catch (err) {
    log.error('auth.session_read_failed', { error: err });
    return null;
  }
});

/** Use at the top of every admin page, server action and route. Redirects to the login when there is no admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
