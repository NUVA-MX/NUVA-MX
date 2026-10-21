import { entrada } from '@/content/entrada';
import styles from './EntryBar.module.css';

/** Fixed top bar over the split panels. Not interactive (pointer-events: none). */
export function EntryBar() {
  return (
    <header className={styles.root}>
      <h1 className={styles.brand}>{entrada.bar.brand}</h1>
      <p className={styles.note}>{entrada.bar.note}</p>
    </header>
  );
}
