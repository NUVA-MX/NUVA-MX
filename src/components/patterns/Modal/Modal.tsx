'use client';

import { useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/cx';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import styles from './Modal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /** center = project detail; side = cart panel sliding from the right. */
  placement?: 'center' | 'side';
  className?: string;
  /** data-theme for the portaled backdrop (the portal renders outside the PageShell). */
  theme?: string;
  /** Extra classes on the backdrop (e.g. font variables of the theme). */
  rootClassName?: string;
  children: ReactNode;
};

const noop = () => () => {};

/**
 * Accessible dialog: role="dialog", aria-modal, focus trap, Escape and backdrop click close it,
 * body scroll is locked and focus returns to the opener.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  placement = 'center',
  className,
  theme,
  rootClassName,
  children,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  useLockBodyScroll(open);
  useFocusTrap(boxRef, open, onClose);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-theme={theme}
      className={cx(styles.backdrop, styles[placement], rootClassName)}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        // Prevent the browser from moving focus to <body>, so focus returns to the opener.
        e.preventDefault();
        onClose();
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cx(styles.box, className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
