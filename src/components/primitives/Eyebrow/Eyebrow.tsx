import type { ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Eyebrow.module.css';

export type EyebrowTracking = 'eyebrow' | 'tagline' | 'entry' | 'label' | 'info' | 'step' | 'meta' | 'cue';

type Props = {
  tone?: 'default' | 'inverse' | 'subtle' | 'current';
  tracking?: EyebrowTracking;
  size?: '2xs' | 'xs' | 'sm';
  as?: ElementType;
  id?: string;
  className?: string;
  children?: ReactNode;
};

export function Eyebrow({
  tone = 'default',
  tracking = 'eyebrow',
  size = '2xs',
  as: Tag = 'p',
  id,
  className,
  children,
}: Props) {
  return (
    <Tag
      id={id}
      className={cx(styles.root, styles[`tone-${tone}`], styles[`tracking-${tracking}`], styles[`size-${size}`], className)}
    >
      {children}
    </Tag>
  );
}
