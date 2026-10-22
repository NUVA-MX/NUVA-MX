import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Media } from '@/components/primitives/Media';
import { Text } from '@/components/primitives/Text';
import { cx } from '@/lib/cx';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import styles from './Hero.module.css';

/** Full-bleed photo hero (olive-to-lemon gradient until there is a photo); title and two buttons sit bottom-left. */
export function Hero({ content: h }: { content: EncargoContent['hero'] }) {
  return (
    <section className={styles.root} aria-labelledby="hero-title">
      {h.image && (
        <>
          <Media src={h.image} alt={h.imageAlt} ratio="fill" tone="inverse" sizes="full" priority />
          <div className={styles.veil} aria-hidden="true" />
        </>
      )}
      <Container className={styles.inner}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={styles.title}>
            {h.title}
          </h1>
          <Text size="lg" tone="inverse" measure="body" className={styles.note}>
            {h.note}
          </Text>
        </div>
        <div className={styles.actions}>
          <Button href={h.primary.href} variant="light" size="xl" icon="whatsapp" className={styles.button}>
            {h.primary.label}
          </Button>
          <Button
            href={h.secondary.href}
            variant="ghost-inverse"
            size="xl"
            className={cx(styles.button, styles.outline)}
          >
            {h.secondary.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
