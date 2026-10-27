import Link from 'next/link';
import { Container } from '@/components/primitives/Container';
import { existencia } from '@/content/existencia';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import styles from './Envios.module.css';

/** Olive band: shipping and exchanges on the left, a pointer to Merch on the right. Sits right before the footer. */
export function Envios() {
  const c = existencia.crossLink;
  return (
    <section id="envios" className={styles.root} aria-label={existencia.nav.links[1].label}>
      <Container>
        <div className={styles.grid}>
          <div>
            {existencia.info.map((item) => (
              <div key={item.label} className={styles.block}>
                <h2 className={styles.title}>{item.label}</h2>
                <p className={styles.text}>{item.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.block}>
            <h2 className={styles.title}>{copy.envios.designTitle}</h2>
            <p className={styles.text}>{copy.envios.designBody}</p>
            <Link href={c.href} className={styles.link}>
              {c.cue}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
