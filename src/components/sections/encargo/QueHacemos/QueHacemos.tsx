import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import { Reveal } from '@/components/patterns/Reveal';
import { encargo } from '@/content/encargo';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import styles from './QueHacemos.module.css';

/**
 * Right after the closing call to action: a photo collage on the left (one square photo with two portraits
 * overlapping its corners) and a short text on the right. Empty photo slots are tinted blocks until the client uploads.
 */
export function QueHacemos({ content: q }: { content: EncargoContent['queHacemos'] }) {
  return (
    <section className={styles.root} aria-labelledby="que-hacemos-title">
      <Container className={styles.inner}>
        <Reveal className={styles.collage}>
          {q.images.map((img, i) => (
            <div key={i} className={styles[`tile${i}`]}>
              <Media src={img.image} alt={img.imageAlt} ratio="fill" sizes="half" />
            </div>
          ))}
        </Reveal>
        <Reveal className={styles.copy}>
          <Eyebrow size="sm" tracking="label">
            {q.eyebrow}
          </Eyebrow>
          <Heading level={2} size="2xl" id="que-hacemos-title" className={styles.title}>
            {q.title}
          </Heading>
          <p className={styles.body}>{q.body}</p>
          <Button href={encargo.queHacemos.cta.href} className={styles.cta}>
            {encargo.queHacemos.cta.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
