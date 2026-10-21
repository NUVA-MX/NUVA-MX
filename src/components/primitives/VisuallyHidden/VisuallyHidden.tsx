import type { ElementType, ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

type Props = { as?: ElementType; id?: string; children?: ReactNode };

export function VisuallyHidden({ as: Tag = 'span', id, children }: Props) {
  return (
    <Tag id={id} className={styles.root}>
      {children}
    </Tag>
  );
}
