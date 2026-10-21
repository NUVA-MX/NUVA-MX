import { cx } from '@/lib/cx';
import styles from './Divider.module.css';

type Props = { tone?: 'default' | 'strong' | 'inverse'; className?: string };

export function Divider({ tone = 'default', className }: Props) {
  return <hr className={cx(styles.root, styles[tone], className)} />;
}
