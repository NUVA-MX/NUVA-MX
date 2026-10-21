import Link from 'next/link';
import type { ReactNode } from 'react';
import { logoutAction } from '@/app/admin/actions';
import { admin } from '@/content/admin';
import { fillTemplate } from '@/lib/format';
import styles from './AdminShell.module.css';

type Props = { email: string; children: ReactNode };

export function AdminShell({ email, children }: Props) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link href="/admin" className={styles.brand}>
            {admin.brand}
          </Link>
          <nav aria-label={admin.list.title} className={styles.nav}>
            {admin.shell.nav.map((l) => (
              <Link key={l.href} href={l.href} className={styles.link}>
                {l.label}
              </Link>
            ))}
          </nav>
          <span className={styles.user}>{fillTemplate(admin.shell.signedInAs, { email })}</span>
          <form action={logoutAction}>
            <button type="submit" className={styles.logout}>
              {admin.shell.logout}
            </button>
          </form>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
