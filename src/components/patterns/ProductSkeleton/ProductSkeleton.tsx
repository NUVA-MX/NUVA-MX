import styles from './ProductSkeleton.module.css';

/** Loading placeholder with the ProductCard footprint. Hidden from assistive tech. */
export function ProductSkeleton() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.media} />
      <div className={styles.body}>
        <span className={styles.lineWide} />
        <span className={styles.lineShort} />
        <span className={styles.lineButton} />
      </div>
    </div>
  );
}
