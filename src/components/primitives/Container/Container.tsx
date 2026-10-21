import type { ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Container.module.css';

export type ContainerSize = 'default' | 'narrow' | 'text' | 'full';

type Props = {
  size?: ContainerSize;
  as?: ElementType;
  id?: string;
  className?: string;
  children?: ReactNode;
};

export function Container({ size = 'default', as: Tag = 'div', id, className, children }: Props) {
  return (
    <Tag id={id} className={cx(styles.root, styles[size], className)}>
      {children}
    </Tag>
  );
}
