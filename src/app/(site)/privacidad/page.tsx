import type { Metadata } from 'next';
import { Container } from '@/components/primitives/Container';
import { privacidad } from '@/content/privacidad';
import styles from './privacidad.module.css';

export const metadata: Metadata = {
  title: privacidad.meta.title,
  description: privacidad.meta.description,
  // A legal page, not a landing page: keep it out of search results.
  robots: { index: false, follow: true },
};

export default function PrivacidadPage() {
  return (
    <main className={styles.root}>
      <Container size="text">
        <h1 className={styles.title}>{privacidad.title}</h1>
        <p className={styles.updated}>{privacidad.updated}</p>
        {privacidad.sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2 className={styles.heading}>{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className={styles.body}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </Container>
    </main>
  );
}
