import { cx } from '@/lib/cx';
import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Media } from '@/components/primitives/Media';
import { Carousel } from '@/components/patterns/Carousel';
import { Reveal } from '@/components/patterns/Reveal';
import { site } from '@/content/site';
import { ui } from '@/content/ui';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './Equipos.module.css';

/** Dark band: large photo carousel, then a centered title, two lines and a highlight button. */
export function Equipos({ content: e }: { content: EncargoContent['equipos'] }) {
  // Slot-only until the client supplies photos: the carousel is left out instead of showing empty frames.
  const slides = e.slides.filter((s) => s.image);
  return (
    <section className={styles.root} aria-labelledby="equipos-title" data-hide-sticky>
      <Container>
        <Reveal>
          <Eyebrow size="sm" tracking="label" tone="inverse" className={styles.eyebrow}>
            {e.eyebrow}
          </Eyebrow>
          {slides.length > 0 && (
            <Carousel
              label={e.carouselLabel}
              labels={{
                carousel: ui.carousel,
                slideRole: ui.slideRole,
                slide: ui.slide,
                goToSlide: ui.goToSlide,
                previous: ui.previous,
                next: ui.next,
              }}
              slides={slides.map((s) => (
                <Media key={s.image} src={s.image} alt={s.imageAlt} ratio="fill" tone="inverse" sizes="equipos" />
              ))}
            />
          )}
        </Reveal>
        <Reveal className={cx(styles.block, slides.length === 0 && styles.alone)}>
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
