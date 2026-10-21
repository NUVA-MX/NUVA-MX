import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Pill.module.css';

export type PillTone = 'neutral' | 'accent' | 'status-ok' | 'status-low' | 'status-out';

type Props = { tone?: PillTone; className?: string; children?: ReactNode };

export function Pill({ tone = 'neutral', className, children }: Props) {
  return <span className={cx(styles.root, styles[tone], className)}>{children}</span>;
}
