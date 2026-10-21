import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import type { SpaceToken } from '@/lib/tokens';
import styles from './Grid.module.css';

type Props = {
  min?: 'sm' | 'md' | 'lg';
  gap?: SpaceToken;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
};

export function Grid({ min = 'md', gap = 6, as: Tag = 'div', className, children }: Props) {
  const style = {
    '--grid-gap': `var(--space-${gap})`,
    '--grid-min': `var(--grid-min-${min})`,
  } as CSSProperties;
  return (
    <Tag className={cx(styles.root, className)} style={style}>
      {children}
    </Tag>
  );
}
