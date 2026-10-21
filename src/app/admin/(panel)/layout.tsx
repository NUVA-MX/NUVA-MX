import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

// No session (or missing env) redirects to /admin/login, which shows the not-configured notice.
// Every page and every server action calls requireAdmin() again: the layout alone is not enough.
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
