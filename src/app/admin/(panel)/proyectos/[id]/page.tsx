import { notFound } from 'next/navigation';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { requireAdmin } from '@/lib/auth/admin';
import { projectIdSchema } from '@/lib/content/encargo-schema';
import { getProjectForAdmin } from '@/server/content/encargo-store';
import { isBlobConfigured } from '@/server/env';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const valid = projectIdSchema.safeParse(id);
  if (!valid.success) notFound();
  const project = await getProjectForAdmin(valid.data);
  if (!project) notFound();
  return (
    <ProjectForm
      blobEnabled={isBlobConfigured()}
      project={{
        id: project.id,
        name: project.name,
        technique: project.technique,
        tag: project.tag,
        meta: project.meta,
        description: project.description,
        techniqueDetail: project.techniqueDetail,
        minimum: project.minimum,
        colors: project.colors,
        delivery: project.delivery,
        imageUrl: project.imageUrl,
        imageAlt: project.imageAlt,
        visible: project.visible,
      }}
    />
  );
}
