import { cx } from '@/lib/cx';
import styles from './InfoGrid.module.css';

export type InfoItem = { label: string; value: string };

type Props = {
  items: readonly InfoItem[];
  columns?: 2 | 3;
  tone?: 'default' | 'inverse';
  className?: string;
};

/** Label/value pairs with a top rule. 2 columns = modal data, 3 = contact block. */
export function InfoGrid({ items, columns = 2, tone = 'default', className }: Props) {
  return (
    <dl className={cx(styles.root, styles[`cols-${columns}`], styles[tone], className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
