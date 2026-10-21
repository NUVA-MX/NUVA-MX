import { entrada } from '@/content/entrada';
import styles from './EntryFooter.module.css';

/** Strip under the split: quote, one line per side, shared note. */
export function EntryFooter() {
  const f = entrada.footer;
  return (
    <footer className={styles.root}>
      <div className={styles.grid}>
        <p className={styles.quote}>{f.quote}</p>
        {f.columns.map((c) => (
          <p key={c.strong} className={styles.text}>
            <strong className={styles.strong}>{c.strong}</strong>
            {c.text}
          </p>
        ))}
        <p className={styles.note}>{f.note}</p>
      </div>
    </footer>
  );
}
