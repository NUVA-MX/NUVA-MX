import { ActionButton } from '@/components/admin/ActionButton';
import { ProjectTable } from '@/components/admin/ProjectTable';
import { Button } from '@/components/primitives/Button';
import { importDefaultProjectsAction } from '@/app/admin/encargo-actions';
import { adminEncargo } from '@/content/admin-encargo';
import { requireAdmin } from '@/lib/auth/admin';
import { MAX_PROJECTS } from '@/lib/content/limits';
import { fillTemplate } from '@/lib/format';
import { listProjectsForAdmin } from '@/server/content/encargo-store';
import styles from '../../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminProjectsPage() {
  await requireAdmin();
  const rows = await listProjectsForAdmin();
  const p = adminEncargo.projects;
  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>{p.title}</h1>
        {rows.length < MAX_PROJECTS && (
          <Button href="/admin/proyectos/nuevo" icon="plus">
            {p.create}
          </Button>
        )}
      </div>
      <p className={styles.counter}>{fillTemplate(p.counter, { n: rows.length, max: MAX_PROJECTS })}</p>
      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>{p.empty}</p>
          <ActionButton action={importDefaultProjectsAction} label={p.import} tone="solid" />
        </div>
      ) : (
        <ProjectTable
          rows={rows.map((r) => ({
            id: r.id,
            name: r.name,
            technique: r.technique,
            visible: r.visible,
            imageUrl: r.imageUrl,
            imageAlt: r.imageAlt,
          }))}
        />
      )}
    </>
  );
}
