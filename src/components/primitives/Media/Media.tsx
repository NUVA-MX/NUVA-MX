import Image from 'next/image';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { imageSizes, type ImageSizeKey } from '@/styles/breakpoints';
import styles from './Media.module.css';

export type MediaRatio = '4/5' | '16/10' | '1/1' | '16/7' | '4/3' | 'fill';

type Props = {
  src?: string | null;
  alt: string;
  ratio?: MediaRatio;
  radius?: 'none' | 'lg' | 'card' | 'block';
  tone?: 'default' | 'inverse';
  sizes?: ImageSizeKey;
  priority?: boolean;
  className?: string;
  /** Empty slot only: tint of a brand color instead of the theme's placeholder fill. */
  tint?: 'olive' | 'wine';
  /** Empty slot only: decorative content (an icon) centered in the slot. */
  children?: ReactNode;
};

/**
 * Image inside an aspect-ratio box. With ratio="fill" it covers its positioned parent.
 * Without src it shows a tinted, text-free block (decorative) and keeps the layout.
 */
export function Media({
  src,
  alt,
  ratio = '4/5',
  radius = 'none',
  tone = 'default',
  sizes = 'half',
  priority = false,
  className,
  tint,
  children,
}: Props) {
  const classes = cx(
    styles.root,
    styles[`ratio-${ratio.replace('/', '-')}`],
    styles[`radius-${radius}`],
    styles[`tone-${tone}`],
    !src && tint && styles[`tint-${tint}`],
    className,
  );
  if (!src) {
    return (
      <div className={classes} aria-hidden="true">
        {children && <span className={styles.slot}>{children}</span>}
      </div>
    );
  }
  return (
    <div className={classes}>
      <Image src={src} alt={alt} fill sizes={imageSizes[sizes]} priority={priority} className={styles.img} />
    </div>
  );
}
