import type { ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Text.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextTone = 'default' | 'muted' | 'subtle' | 'inverse' | 'inverse-muted' | 'eyebrow' | 'link';

type Props = {
  size?: TextSize;
  tone?: TextTone;
  measure?: 'body' | 'lead' | 'split' | 'none';
  leading?: 'body' | 'lead' | 'relaxed';
  weight?: 'regular' | 'medium';
  align?: 'start' | 'center';
  as?: ElementType;
  id?: string;
  className?: string;
  children?: ReactNode;
};

export function Text({
  size = 'md',
  tone = 'default',
  measure = 'none',
  leading = 'body',
  weight = 'regular',
  align,
  as: Tag = 'p',
  id,
  className,
  children,
}: Props) {
  return (
    <Tag
      id={id}
      className={cx(
        styles.root,
        styles[`size-${size}`],
        styles[`tone-${tone}`],
        styles[`measure-${measure}`],
        styles[`leading-${leading}`],
        styles[`weight-${weight}`],
        align && styles[`align-${align}`],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
