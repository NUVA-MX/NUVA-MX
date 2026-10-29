'use client';

import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { useHoldRepeat } from '@/lib/useHoldRepeat';
import styles from './HoldStepButton.module.css';

type Props = {
  value: number;
  direction: 1 | -1;
  max: number;
  onChange: (next: number) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
};

/** "−" / "+" quantity button: one step per tap, keeps stepping while held (touch, mouse, pen); no text selection or callout. */
export function HoldStepButton({ value, direction, max, onChange, ariaLabel, className, disabled, children }: Props) {
  const handlers = useHoldRepeat({ value, direction, max, onChange });
  return (
    <button type="button" className={cx(styles.root, className)} aria-label={ariaLabel} disabled={disabled} {...handlers}>
      {children}
    </button>
  );
}
