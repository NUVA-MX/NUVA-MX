import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './PageShell.module.css';

type Props = {
  theme: 'encargo' | 'existencia' | 'entrada' | 'taller';
  /** Which side of the shop this page is: drives the per-side surface and marker tokens. */
  side?: 'encargo' | 'existencia';
  nav?: ReactNode;
  footer?: ReactNode;
  /** Text of the "skip to content" link. */
  skipLabel?: string;
  /** Extra classes on the root (e.g. next/font variables for a theme). */
  className?: string;
  children: ReactNode;
};

/** Page root: sets data-theme so every token below follows the side of the business. */
export function PageShell({ theme, side, nav, footer, skipLabel, className, children }: Props) {
  return (
    <div data-theme={theme} data-side={side} className={cx(styles.root, className)}>
      {skipLabel && (
        <a href="#contenido" className={styles.skip}>
          {skipLabel}
        </a>
      )}
      {nav}
      <main id="contenido" className={styles.main} tabIndex={-1}>
        {children}
      </main>
      {footer}
    </div>
  );
}
