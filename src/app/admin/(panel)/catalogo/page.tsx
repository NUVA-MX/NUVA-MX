import { CatalogSyncButton } from '@/components/admin/CatalogSyncButton';
import { Button } from '@/components/primitives/Button';
import { adminCatalog as t } from '@/content/admin-catalog';
import { requireAdmin } from '@/lib/auth/admin';
import { fillTemplate } from '@/lib/format';
import { getCatalogStatus } from '@/server/catalog/status';
import styles from '../../admin.module.css';
import tableStyles from './catalogo.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Mexico_City' });
const onOff = (on: boolean): string => (on ? t.status.on : t.status.off);

export default async function AdminCatalogPage() {
  await requireAdmin();
  const status = await getCatalogStatus();
  const lastSuccess = status.runs.find((r) => r.status === 'success');
  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>{t.title}</h1>
        <Button href="/existencia#catalogo" variant="secondary">
          {t.viewPublic}
        </Button>
      </div>
      <p className={styles.intro}>{t.intro}</p>
      {!status.dbConfigured ? (
        <div className={styles.empty}>
          <p>{t.notConfigured}</p>
        </div>
      ) : (
        <div className={styles.stack}>
          <section aria-labelledby="estado">
            <h2 id="estado" className={tableStyles.subtitle}>
              {t.status.title}
            </h2>
            <dl className={tableStyles.facts}>
              <dt>{t.status.products}</dt>
              <dd>{status.activeProducts}</dd>
              <dt>{t.status.provider}</dt>
              <dd>{onOff(status.providerEnabled)}</dd>
              <dt>{t.status.publicSection}</dt>
              <dd>{onOff(status.publicEnabled)}</dd>
              <dt>{t.status.lastSuccess}</dt>
              <dd>{lastSuccess?.finishedAt ? dateFormat.format(lastSuccess.finishedAt) : t.status.never}</dd>
            </dl>
          </section>
          <section aria-labelledby="sincronizar">
            <h2 id="sincronizar" className={tableStyles.subtitle}>
              {t.sync.title}
            </h2>
            <p className={styles.intro}>{t.sync.hint}</p>
            <CatalogSyncButton />
          </section>
          <section aria-labelledby="corridas">
            <h2 id="corridas" className={tableStyles.subtitle}>
              {t.runs.title}
            </h2>
            {status.runs.length === 0 ? (
              <p className={styles.intro}>{t.runs.empty}</p>
            ) : (
              <div className={tableStyles.scroll}>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th scope="col">{t.runs.columns.started}</th>
                      <th scope="col">{t.runs.columns.trigger}</th>
                      <th scope="col">{t.runs.columns.status}</th>
                      <th scope="col">{t.runs.columns.counts}</th>
                      <th scope="col">{t.runs.columns.error}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.runs.map((r) => (
                      <tr key={r.startedAt.toISOString()}>
                        <td>{dateFormat.format(r.startedAt)}</td>
                        <td>{t.runs.triggers[r.trigger as keyof typeof t.runs.triggers] ?? r.trigger}</td>
                        <td>{t.runs.statuses[r.status as keyof typeof t.runs.statuses] ?? r.status}</td>
                        <td>{fillTemplate(t.runs.counts, { accepted: r.accepted, rejected: r.rejected, deactivated: r.deactivated })}</td>
                        <td>{r.errorKind ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
