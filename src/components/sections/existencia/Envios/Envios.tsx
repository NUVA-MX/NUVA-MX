import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { CrossLink } from '@/components/patterns/CrossLink';
import { existencia } from '@/content/existencia';
import styles from './Envios.module.css';

export function Envios() {
  const c = existencia.crossLink;
  return (
    <section id="envios" className={styles.root} aria-label={existencia.nav.links[1].label}>
      <Container>
        <div className={styles.grid}>
          {existencia.info.map((item) => (
            <div key={item.label}>
              <Eyebrow as="h2" tracking="info">
                {item.label}
              </Eyebrow>
              <p className={styles.text}>{item.body}</p>
            </div>
          ))}
          <CrossLink variant="compact" href={c.href} eyebrow={c.eyebrow} body={c.body} cue={c.cue} />
        </div>
      </Container>
    </section>
  );
}
