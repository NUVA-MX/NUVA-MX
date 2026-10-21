import Link from 'next/link';
import { toggleVisibleAction } from '@/app/admin/actions';
import { admin } from '@/content/admin';
import { Media } from '@/components/primitives/Media';
import { Pill } from '@/components/primitives/Pill';
import { formatMXN } from '@/lib/format';
import { DeleteButton } from '../DeleteButton';
import styles from './ProductTable.module.css';

export type ProductTableRow = {
  id: string;
  name: string;
  price: number | null;
  stock: number | null;
  visible: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

type Props = { rows: readonly ProductTableRow[] };

export function ProductTable({ rows }: Props) {
  const c = admin.list.columns;
  if (rows.length === 0) return <p className={styles.empty}>{admin.list.empty}</p>;
  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <caption className={styles.caption}>{admin.list.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{c.image}</th>
            <th scope="col">{c.name}</th>
            <th scope="col">{c.price}</th>
            <th scope="col">{c.stock}</th>
            <th scope="col">{c.visible}</th>
            <th scope="col">{c.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <div className={styles.thumb}>
                  <Media src={p.imageUrl} alt={p.imageAlt ?? p.name} ratio="1/1" sizes="thumb" />
                </div>
              </td>
              <th scope="row" className={styles.name}>
                {p.name}
              </th>
              <td>{p.price === null ? admin.list.noValue : formatMXN(p.price)}</td>
              <td>{p.stock ?? admin.list.noValue}</td>
              <td>
                <Pill tone={p.visible ? 'accent' : 'neutral'}>{p.visible ? admin.list.visibleYes : admin.list.visibleNo}</Pill>
              </td>
              <td>
                <div className={styles.actions}>
                  <form action={toggleVisibleAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={styles.linkButton}>
                      {p.visible ? admin.list.hide : admin.list.show}
                    </button>
                  </form>
                  <Link href={`/admin/productos/${p.id}`} className={styles.link}>
                    {admin.list.edit}
                  </Link>
                  <DeleteButton id={p.id} name={p.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
