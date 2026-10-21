import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import styles from './CrossLink.module.css';

type Props = {
  href: string;
  eyebrow: string;
  title?: ReactNode;
  body: string;
  cue: string;
  media?: { src: string | null; alt: string };
  /** Theme of the other side of the business, applied with data-theme. */
  theme?: string;
  variant?: 'full' | 'compact';
  /** Extra classes on the full variant's <section> (e.g. an outer radius). */
  className?: string;
};

/**
 * Bridge to the other side of the business.
 * full: the whole block is a link (title, body, cue, photo). compact: text column with the cue as link.
 */
export function CrossLink({ href, eyebrow, title, body, cue, media, theme, variant = 'full', className }: Props) {
  if (variant === 'compact') {
    return (
      <div className={styles.compact} data-theme={theme}>
        <Eyebrow tracking="info">{eyebrow}</Eyebrow>
        <p className={styles.compactBody}>{body}</p>
        <Link href={href} className={styles.compactCue}>
          {cue}
        </Link>
      </div>
    );
  }

  return (
    <section className={cx(styles.section, className)} data-theme={theme}>
      <Link href={href} className={styles.full}>
        <div className={styles.text}>
          <Eyebrow tone="inverse" tracking="entry">
            {eyebrow}
          </Eyebrow>
          {title && (
            <Heading level={2} size="2xl" tone="inverse" className={styles.title}>
              {title}
            </Heading>
          )}
          <p className={styles.body}>{body}</p>
          <span className={styles.cue}>
            <span>{cue}</span>
            <span className={styles.line} aria-hidden="true" />
          </span>
        </div>
        <div className={cx(styles.media)}>
          {media && <Media src={media.src} alt={media.alt} ratio="fill" tone="inverse" sizes="half" />}
        </div>
      </Link>
    </section>
  );
}
