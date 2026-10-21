import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import type { SpaceToken } from '@/lib/tokens';
import styles from './Stack.module.css';

type Props = {
  gap?: SpaceToken;
  direction?: 'column' | 'row';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  as?: ElementType;
  id?: string;
  className?: string;
  children?: ReactNode;
};

export function Stack({
  gap = 4,
  direction = 'column',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  as: Tag = 'div',
  id,
  className,
  children,
}: Props) {
  const style = { '--stack-gap': `var(--space-${gap})` } as CSSProperties;
  return (
    <Tag
      id={id}
      className={cx(
        styles.root,
        styles[direction],
        styles[`align-${align}`],
        styles[`justify-${justify}`],
        wrap && styles.wrap,
        className,
      )}
      style={style}
    >
      {children}
    </Tag>
  );
}
