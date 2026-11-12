import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Media } from '@/components/primitives/Media';
import { Text } from '@/components/primitives/Text';
import { cx } from '@/lib/cx';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import styles from './Hero.module.css';
import promo from './HeroPromo.module.css';

/** Full-bleed photo hero (side-colored gradient (olive on /encargo, wine on /existencia) until there is a photo); title and two buttons sit bottom-left. */
type HeroProps = {
  content: EncargoContent['hero'];
  /** Icon on the primary button. WhatsApp on /encargo; /existencia scrolls to the products, so it uses the arrow. */
  primaryIcon?: 'whatsapp' | 'arrow';
};

export function Hero({ content: h, primaryIcon = 'whatsapp' }: HeroProps) {
  return (
    <section className={cx(styles.root, promo.root)} aria-labelledby="hero-title">
      {h.image && (
        <>
          <Media src={h.image} alt={h.imageAlt} ratio="fill" tone="inverse" sizes="full" priority />
          <div className={styles.veil} aria-hidden="true" />
        </>
      )}
      <Container className={cx(styles.inner, promo.inner)}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={cx(styles.title, promo.title)}>
            {h.title}
          </h1>
          <Text size="lg" tone="inverse" measure="body" className={cx(styles.note, promo.note)}>
            {h.note}
          </Text>
        </div>
        <div className={cx(styles.actions, promo.actions)}>
          <Button
            href={h.primary.href}
            variant="light"
            size="xl"
            icon={primaryIcon}
            iconPosition={primaryIcon === 'arrow' ? 'end' : undefined}
            className={cx(styles.button, promo.button)}
          >
            {h.primary.label}
          </Button>
          <Button
            href={h.secondary.href}
            variant="ghost-inverse"
            size="xl"
            className={cx(styles.button, styles.outline, promo.button, promo.outline)}
          >
            {h.secondary.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
