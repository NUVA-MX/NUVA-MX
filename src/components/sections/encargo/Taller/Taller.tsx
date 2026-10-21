import { cx } from '@/lib/cx';
import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import { Text } from '@/components/primitives/Text';
import { Reveal } from '@/components/patterns/Reveal';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import styles from './Taller.module.css';

/** Two columns: title, paragraph and three figures | vertical photo. Stacked with the photo first. */
export function Taller({ content: t }: { content: EncargoContent['taller'] }) {
  return (
    <section id="taller" className={styles.root} aria-labelledby="taller-title">
      <Container>
        <div className={cx(styles.grid, !t.image && styles.noPhoto)}>
          {/* Slot-only until the client supplies the photo: no empty frame. */}
          {t.image && (
            <Reveal className={styles.photo}>
              <Media src={t.image} alt={t.imageAlt} ratio="4/5" radius="card" sizes="half" />
            </Reveal>
          )}
          <Reveal className={styles.copy}>
            <Eyebrow size="sm" tracking="label">
              {t.eyebrow}
            </Eyebrow>
            <Heading level={2} size="2xl" id="taller-title" className={styles.title}>
              {t.title}
            </Heading>
            <Text size="xl" leading="lead" tone="muted" measure="body" className={styles.paragraph}>
              {t.paragraph}
            </Text>
            <dl className={styles.stats}>
              {t.stats.map((s, i) => (
                <div key={i} className={styles.stat}>
                  <dt className={styles.label}>{s.label}</dt>
                  <dd className={styles.value}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
