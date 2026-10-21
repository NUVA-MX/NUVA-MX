import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Heading.module.css';

export type HeadingSize = 'xs' | 'product' | 'sm' | 'step' | 'md' | 'lg' | 'modal' | 'xl' | '2xl' | 'hero' | 'split';

type Props = {
  level?: 1 | 2 | 3 | 4;
  /** Render a non-heading element (e.g. 'p' or 'span') with heading styles. */
  as?: 'p' | 'span' | 'div';
  size?: HeadingSize;
  tone?: 'default' | 'inverse';
  id?: string;
  className?: string;
  children?: ReactNode;
};

export function Heading({ level = 2, as, size = 'xl', tone = 'default', id, className, children }: Props) {
  const Tag = as ?? (`h${level}` as const);
  return (
    <Tag id={id} className={cx(styles.root, styles[`size-${size}`], styles[`tone-${tone}`], className)}>
      {children}
    </Tag>
  );
}
