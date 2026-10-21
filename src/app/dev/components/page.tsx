import { notFound } from 'next/navigation';
import { PatternsDemo } from './PatternsDemo';
import { PrimitivesDemo } from './PrimitivesDemo';
import styles from './page.module.css';

export const metadata = { title: 'Componentes (dev)', robots: { index: false } };

const themes = ['encargo', 'existencia', 'entrada'] as const;

export default function ComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className={styles.page}>
      <h1 className={styles.h1}>Componentes</h1>
      {themes.map((theme) => (
        <section key={theme} data-theme={theme} className={styles.theme}>
          <h2 className={styles.themeTitle}>data-theme=&quot;{theme}&quot;</h2>
          <PrimitivesDemo />
          <PatternsDemo theme={theme} />
        </section>
      ))}
    </main>
  );
}
