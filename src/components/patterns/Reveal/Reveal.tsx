'use client';

import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { useReveal } from '@/lib/useReveal';
import styles from './Reveal.module.css';

/**
 * up: fade and lift (default). left / right: slide in sideways on wide screens (lift on phones).
 * scale: fade and grow slightly. plain: the box itself does not animate; children can key off [data-visible].
 */
export type RevealVariant = 'up' | 'left' | 'right' | 'scale' | 'plain';

type Props = {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
  variant?: RevealVariant;
  /** Delay in ms, to stagger siblings. */
  delay?: number;
};

/** Fades and moves its content in once, when it enters the viewport. */
export function Reveal({ as: Tag = 'div', className, children, variant = 'up', delay }: Props) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <Tag
      ref={ref}
      data-visible={visible ? 'true' : 'false'}
      style={style}
      className={cx(styles.root, variant !== 'up' && styles[variant], visible && styles.visible, className)}
    >
      {children}
    </Tag>
  );
}
