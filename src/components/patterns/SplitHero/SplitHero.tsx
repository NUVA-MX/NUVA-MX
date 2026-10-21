import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import { Text } from '@/components/primitives/Text';
import styles from './SplitHero.module.css';

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleSize?: 'hero' | 'split';
  tagline?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  /** Extra row under the body (e.g. short facts). */
  facts?: readonly string[];
  media: { src: string | null; alt: string };
  height?: 'default' | 'store';
};

/** Two-column hero: dark text column + photo. Stacks on mobile (text first). */
export function SplitHero({
  eyebrow,
  title,
  titleSize = 'hero',
  tagline,
  body,
  actions,
  facts,
  media,
  height = 'default',
}: Props) {
  return (
    <section className={cx(styles.root, styles[height])}>
      <div className={styles.text}>
        {eyebrow && (
          <Eyebrow tone="inverse" tracking="entry">
            {eyebrow}
          </Eyebrow>
        )}
        <Heading level={1} size={titleSize} tone="inverse">
          {title}
        </Heading>
        {tagline && (
          <Eyebrow tone="inverse" tracking="tagline" size="sm" className={styles.tagline}>
            {tagline}
          </Eyebrow>
        )}
        {body && (
          <Text size="xl" leading="lead" tone="inverse-muted" measure="lead" className={styles.body}>
            {body}
          </Text>
        )}
        {facts && facts.length > 0 && (
          <ul className={styles.facts}>
            {facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.media}>
        <Media src={media.src} alt={media.alt} ratio="fill" tone="inverse" sizes="half" priority />
      </div>
    </section>
  );
}
