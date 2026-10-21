import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { NotConfigured } from '@/components/admin/NotConfigured';
import { getAdmin, missingAdminEnv } from '@/lib/auth/admin';
import { isProduction } from '@/server/env';
import { log } from '@/server/log/logger';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

// TODO(confirm): email reset (needs an email provider and a verified domain); for now `npm run admin:create`.
export default async function LoginPage() {
  const missing = missingAdminEnv();
  if (missing.length > 0) {
    // Variable names are only shown in development; in production they are logged, not shown to visitors.
    log.error('admin.not_configured', { missing });
    return (
      <main className={styles.page}>
        <NotConfigured missing={isProduction() ? [] : missing} />
      </main>
    );
  }
  if (await getAdmin()) redirect('/admin');
  return (
    <main className={styles.page}>
      <LoginForm />
    </main>
  );
}
