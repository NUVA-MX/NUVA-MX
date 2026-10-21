import type { ReactNode } from 'react';
import { tallerFonts } from './fonts';
import styles from './TallerFonts.module.css';

/**
 * Carries the DM font variables of the taller theme. Render it from a route layout, not a page:
 * Turbopack merges page CSS into one chunk shared by every route, which would preload the DM fonts on /.
 * The wrapper has no box (display: contents).
 */
export function TallerFonts({ children }: { children: ReactNode }) {
  return <div className={`${tallerFonts} ${styles.fonts}`}>{children}</div>;
}
