'use client';

import { useActionState } from 'react';
import { syncCatalogAction } from '@/app/admin/catalog-actions';
import { Button } from '@/components/primitives/Button';
import { adminCatalog } from '@/content/admin-catalog';
import { idleSyncState, type CatalogSyncState } from '@/lib/catalog/sync-state';
import { fillTemplate } from '@/lib/format';
import styles from './CatalogSyncButton.module.css';

function describe(state: CatalogSyncState): string {
  const text = adminCatalog.sync.result[state.status];
  return fillTemplate(text, {
    accepted: state.accepted,
    rejected: state.rejected,
    deactivated: state.deactivated,
    errorKind: state.errorKind ?? '',
  });
}

/** "Sync now": one form, the server action re-checks the admin session and the supplier window itself. */
export function CatalogSyncButton() {
  const [state, formAction, pending] = useActionState(() => syncCatalogAction(), idleSyncState);
  return (
    <form action={formAction} className={styles.form}>
      <Button type="submit" disabled={pending}>
        {pending ? adminCatalog.sync.working : adminCatalog.sync.button}
      </Button>
      <p className={styles.result} role="status">
        {state.status === 'idle' ? '' : describe(state)}
      </p>
    </form>
  );
}
