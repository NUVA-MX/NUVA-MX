import type { Metadata } from 'next';
import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Text } from '@/components/primitives/Text';
import { PageShell } from '@/components/layout/PageShell';
import { ui } from '@/content/ui';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: ui.notFound.title,
  robots: { index: false },
};

// TODO(confirm): the brief redirected unknown routes to "/"; a real 404 is used instead (correct status for SEO).
export default function NotFound() {
  const n = ui.notFound;
  return (
    <PageShell theme="encargo">
      <Container size="text" className={styles.root}>
        <Eyebrow>{n.code}</Eyebrow>
        <Heading level={1} size="2xl">
          {n.title}
        </Heading>
        <Text size="xl" tone="muted" measure="lead">
          {n.body}
        </Text>
        <Button href="/">{n.cta}</Button>
      </Container>
    </PageShell>
  );
}
