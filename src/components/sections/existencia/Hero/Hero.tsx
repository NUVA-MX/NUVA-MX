import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Text } from '@/components/primitives/Text';
import { existencia } from '@/content/existencia';
import { encargo } from '@/content/encargo';
import { site } from '@/content/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './Hero.module.css';

/** Promocionales hero: wine-to-white gradient with a light grain; the primary button scrolls to the catalog. */
export function Hero() {
  const h = existencia.hero;
  const whatsapp = buildWhatsAppLink({ phone: site.whatsapp.phone, message: encargo.whatsapp.messages.general });
  return (
    <section className={styles.root} aria-labelledby="hero-title">
      <Container className={styles.inner}>
        <h1 id="hero-title" className={styles.title}>
          {h.title}
        </h1>
        <Text size="lg" tone="inverse" measure="body" className={styles.note}>
          {h.note}
        </Text>
        <div className={styles.actions}>
          <Button href={h.primary.href} variant="light" size="xl" icon="arrow" iconPosition="end" className={styles.primary}>
            {h.primary.label}
          </Button>
          <Button href={whatsapp} variant="ghost-inverse" size="xl" className={styles.outline}>
            {h.secondary.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
