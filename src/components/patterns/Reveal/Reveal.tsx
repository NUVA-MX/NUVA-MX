'use client';

import type { ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { useReveal } from '@/lib/useReveal';
import styles from './Reveal.module.css';

type Props = { as?: ElementType; className?: string; children?: ReactNode };

/** Fades and lifts its content in once, when it enters the viewport. */
export function Reveal({ as: Tag = 'div', className, children }: Props) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref} className={cx(styles.root, visible && styles.visible, className)}>
      {children}
    </Tag>
  );
}
