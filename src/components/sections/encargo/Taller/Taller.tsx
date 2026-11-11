import Image from 'next/image';
import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import { Text } from '@/components/primitives/Text';
import { Reveal } from '@/components/patterns/Reveal';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import { TallerArt } from './TallerArt';
import styles from './Taller.module.css';

/**
 * Two columns: title and paragraph | photo collage (large frame, small overlapping frame, orange ribbon and
 * the NUVA seal). Frames show placeholder art until the client supplies the photo. Stacked with the collage first.
 */
export function Taller({ content: t }: { content: EncargoContent['taller'] }) {
  // The last two words of the title are set in the accent color ("tus ideas.").
  const words = t.title.split(' ');
  const split = Math.max(words.length - 2, 0);
  const head = words.slice(0, split).join(' ');
  const accent = words.slice(split).join(' ');
  return (
    <section id="taller" className={styles.root} aria-labelledby="taller-title">
      <Container>
        <div className={styles.grid}>
          <Reveal className={styles.visual}>
            <div className={styles.main}>
              {t.image ? (
                <Media src={t.image} alt={t.imageAlt} ratio="fill" sizes="half" />
              ) : (
                <TallerArt className={styles.art} />
              )}
            </div>
            {!t.image && (
              <div className={styles.small}>
                <TallerArt className={styles.art} />
              </div>
            )}
            <Image
              src="/brand/line-orange.png"
              alt=""
              width={464}
              height={480}
              className={styles.ribbon}
              aria-hidden="true"
            />
            <Image src="/brand/sello-nuva.png" alt="" width={507} height={520} className={styles.seal} aria-hidden="true" />
          </Reveal>
          <Reveal className={styles.copy}>
            <Eyebrow size="sm" tracking="label" className={styles.eyebrow}>
              {t.eyebrow}
            </Eyebrow>
            <Heading level={2} size="2xl" id="taller-title" className={styles.title}>
              {head}
              {accent && <span className={styles.accent}> {accent}</span>}
            </Heading>
            <Text size="lg" leading="lead" measure="body" className={styles.paragraph}>
              {t.paragraph}
            </Text>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
