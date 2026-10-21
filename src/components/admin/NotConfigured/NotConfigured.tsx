import { admin } from '@/content/admin';
import styles from './NotConfigured.module.css';

type Props = { missing: readonly string[] };

/** Lists the missing env var NAMES only (never values). */
export function NotConfigured({ missing }: Props) {
  return (
    <section className={styles.root} aria-labelledby="admin-not-configured">
      <h1 id="admin-not-configured" className={styles.title}>
        {admin.notConfigured.title}
      </h1>
      {missing.length > 0 && (
        <>
          <p className={styles.text}>{admin.notConfigured.body}</p>
          <ul className={styles.list}>
            {missing.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className={styles.help}>{admin.notConfigured.help}</p>
    </section>
  );
}
