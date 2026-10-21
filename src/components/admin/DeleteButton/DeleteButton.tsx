'use client';

import { deleteProductAction } from '@/app/admin/actions';
import { admin } from '@/content/admin';
import { fillTemplate } from '@/lib/format';
import styles from './DeleteButton.module.css';

type Props = { id: string; name: string };

/** Delete with a confirm dialog. The server action re-checks the admin session. */
export function DeleteButton({ id, name }: Props) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!window.confirm(fillTemplate(admin.list.deleteConfirm, { name }))) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={styles.button}>
        {admin.list.delete}
      </button>
    </form>
  );
}
