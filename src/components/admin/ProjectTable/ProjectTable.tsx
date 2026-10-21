import Link from 'next/link';
import {
  deleteEncargoProjectAction,
  moveEncargoProjectAction,
  toggleEncargoProjectVisibleAction,
} from '@/app/admin/encargo-actions';
import { adminEncargo } from '@/content/admin-encargo';
import { Media } from '@/components/primitives/Media';
import { Pill } from '@/components/primitives/Pill';
import { fillTemplate } from '@/lib/format';
import { ActionButton } from '../ActionButton';
import styles from './ProjectTable.module.css';

export type ProjectTableRow = {
  id: string;
  name: string;
  technique: string;
  visible: boolean;
  imageUrl: string | null;
  imageAlt: string;
};

type Props = { rows: readonly ProjectTableRow[] };

export function ProjectTable({ rows }: Props) {
  const p = adminEncargo.projects;
  const c = p.columns;
  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <caption className={styles.caption}>{p.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{c.image}</th>
            <th scope="col">{c.name}</th>
            <th scope="col">{c.technique}</th>
            <th scope="col">{c.visible}</th>
            <th scope="col">{c.order}</th>
            <th scope="col">{c.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id}>
              <td>
                <div className={styles.thumb}>
                  <Media src={row.imageUrl} alt={row.imageAlt || row.name} ratio="4/5" sizes="thumb" />
                </div>
              </td>
              <th scope="row" className={styles.name}>
                {row.name}
              </th>
              <td>{row.technique}</td>
              <td>
                <Pill tone={row.visible ? 'accent' : 'neutral'}>{row.visible ? p.visibleYes : p.visibleNo}</Pill>
              </td>
              <td>
                <div className={styles.actions}>
                  <ActionButton
                    action={moveEncargoProjectAction}
                    fields={{ id: row.id, direction: 'up' }}
                    label={p.up}
                    ariaLabel={fillTemplate(p.moveUp, { name: row.name })}
                    disabled={i === 0}
                  />
                  <ActionButton
                    action={moveEncargoProjectAction}
                    fields={{ id: row.id, direction: 'down' }}
                    label={p.down}
                    ariaLabel={fillTemplate(p.moveDown, { name: row.name })}
                    disabled={i === rows.length - 1}
                  />
                </div>
              </td>
              <td>
                <div className={styles.actions}>
                  <ActionButton
                    action={toggleEncargoProjectVisibleAction}
                    fields={{ id: row.id }}
                    label={row.visible ? p.hide : p.show}
                  />
                  <Link href={`/admin/proyectos/${row.id}`} className={styles.link}>
                    {p.edit}
                  </Link>
                  <ActionButton
                    action={deleteEncargoProjectAction}
                    fields={{ id: row.id }}
                    label={p.delete}
                    tone="danger"
                    confirm={fillTemplate(p.deleteConfirm, { name: row.name })}
                    disabled={rows.length <= 1}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length <= 1 && <p className={styles.hint}>{p.lastHint}</p>}
    </div>
  );
}
