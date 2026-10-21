import { notFound } from 'next/navigation';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { requireAdmin } from '@/lib/auth/admin';
import { MAX_PROJECTS } from '@/lib/content/limits';
import { listProjectsForAdmin } from '@/server/content/encargo-store';
import { isBlobConfigured } from '@/server/env';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function NewProjectPage() {
  await requireAdmin();
  // The "Nuevo" link is hidden at the limit; the action also rejects the 25th under a DB lock.
  if ((await listProjectsForAdmin()).length >= MAX_PROJECTS) notFound();
  return <ProjectForm blobEnabled={isBlobConfigured()} />;
}
