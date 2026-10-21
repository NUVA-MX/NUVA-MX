import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import { Reveal } from '@/components/patterns/Reveal';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import styles from './Tecnicas.module.css';

/** The techniques as cards: a portrait photo (tinted block until the client uploads), the name and one fact. */
export function Tecnicas({ content: t }: { content: EncargoContent['tecnicas'] }) {
  return (
    <section className={styles.root} aria-labelledby="tecnicas-title">
      <Container>
        <Reveal className={styles.head}>
          <Eyebrow size="sm" tracking="label">
            {t.eyebrow}
          </Eyebrow>
          <Heading level={2} size="2xl" id="tecnicas-title" className={styles.title}>
            {t.title}
          </Heading>
        </Reveal>
        <ul className={styles.list}>
          {t.items.map((item) => (
            <li key={item.id}>
              <Reveal className={styles.card}>
                <Media src={item.image} alt={item.imageAlt} ratio="4/5" radius="card" sizes="tecnica" />
                <h3 className={styles.name}>{item.name}</h3>
                <p className={styles.fact}>{item.fact}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
