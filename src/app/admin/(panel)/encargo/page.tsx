import { Button } from '@/components/primitives/Button';
import { EncargoSectionForm } from '@/components/admin/EncargoSectionForm';
import { adminEncargo } from '@/content/admin-encargo';
import { encargo } from '@/content/encargo';
import { requireAdmin } from '@/lib/auth/admin';
import { blobPublicHost } from '@/lib/blob';
import { buildSectionSpecs } from '@/lib/content/encargo-spec';
import { readOverridesForAdmin } from '@/server/content/encargo-store';
import { blobToken, isBlobConfigured } from '@/server/env';
import styles from '../../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminEncargoPage() {
  await requireAdmin();
  const { overrides, updatedAt } = await readOverridesForAdmin(blobPublicHost(blobToken()));
  const specs = buildSectionSpecs(encargo, overrides, new Date());
  const version = String(updatedAt?.getTime() ?? 0);
  const c = adminEncargo.page;
  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>{c.title}</h1>
        <div className={styles.headActions}>
          <Button href="/admin/proyectos" variant="secondary">
            {c.manageProjects}
          </Button>
          <Button href="/encargo" external>
            {c.viewPage}
          </Button>
        </div>
      </div>
      <p className={styles.intro}>{c.intro}</p>
      <div className={styles.stack}>
        {specs.map((spec) => (
          <EncargoSectionForm key={`${spec.key}-${version}`} spec={spec} blobEnabled={isBlobConfigured()} />
        ))}
      </div>
    </>
  );
}
