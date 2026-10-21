import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './StatusMessage.module.css';

type Props = {
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: 'default' | 'error';
  className?: string;
};

/** Empty/error message. Errors are announced with role="alert", the rest with role="status". */
export function StatusMessage({ title, body, action, tone = 'default', className }: Props) {
  return (
    <div className={cx(styles.root, styles[tone], className)} role={tone === 'error' ? 'alert' : 'status'}>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
