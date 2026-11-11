import { Container } from '@/components/primitives/Container';
import heroStyles from '@/components/sections/encargo/Hero/Hero.module.css';
import styles from './SideSkeleton.module.css';

/** Shown in place of the page while the other side loads: same hero shape and brand color, no text. */
export function SideSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Cargando…</span>
      <section className={heroStyles.root} aria-hidden="true">
        <Container className={heroStyles.inner}>
          <div className={heroStyles.copy}>
            <span className={`${styles.bar} ${styles.title}`} />
            <span className={`${styles.bar} ${styles.title} ${styles.short}`} />
            <span className={`${styles.bar} ${styles.note}`} />
          </div>
          <div className={heroStyles.actions}>
            <span className={`${styles.bar} ${styles.button}`} />
            <span className={`${styles.bar} ${styles.button}`} />
          </div>
        </Container>
      </section>
      <Container>
        <div className={styles.cards} aria-hidden="true">
          <span className={styles.card} />
          <span className={styles.card} />
          <span className={styles.card} />
        </div>
      </Container>
    </div>
  );
}
