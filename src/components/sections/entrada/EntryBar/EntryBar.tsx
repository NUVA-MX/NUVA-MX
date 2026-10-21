import Image from 'next/image';
import { entrada } from '@/content/entrada';
import styles from './EntryBar.module.css';

/** Fixed top bar over the split panels. Not interactive (pointer-events: none). */
export function EntryBar() {
  return (
    <header className={styles.root}>
      <h1 className={styles.brand}>
        <Image src="/brand/logo-nuva-gris.png" alt={entrada.bar.brand} width={800} height={244} priority className={styles.logo} />
      </h1>
      {/* TODO: tagline hidden for now ({entrada.bar.note}). */}
    </header>
  );
}
