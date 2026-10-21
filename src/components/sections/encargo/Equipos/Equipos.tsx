import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Reveal } from '@/components/patterns/Reveal';
import { site } from '@/content/site';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './Equipos.module.css';

/** Dark band: centered eyebrow, title, two lines and a highlight button. */
export function Equipos({ content: e }: { content: EncargoContent['equipos'] }) {
  return (
    <section className={styles.root} aria-labelledby="equipos-title" data-hide-sticky>
      <Container>
        <Reveal className={styles.block}>
          <Eyebrow size="sm" tracking="label" tone="inverse" className={styles.eyebrow}>
            {e.eyebrow}
          </Eyebrow>
          <h2 id="equipos-title" className={styles.title}>
            {e.title}
          </h2>
          {e.lines.map((line, i) => (
            <p key={i} className={styles.line}>
              {line}
            </p>
          ))}
          <Button
            href={buildWhatsAppLink({ phone: site.whatsapp.phone, message: e.ctaMessage })}
            external
            variant="light"
            size="xl"
            className={styles.cta}
          >
            {e.cta}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
