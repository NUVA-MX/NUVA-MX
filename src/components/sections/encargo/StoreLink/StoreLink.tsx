import { Container } from '@/components/primitives/Container';
import { CrossLink } from '@/components/patterns/CrossLink';
import { Reveal } from '@/components/patterns/Reveal';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import styles from './StoreLink.module.css';

/** Link to the store; it inherits the taller theme like /existencia itself, so the jump does not change colors. The whole block is one link. */
export function StoreLink({ content: x }: { content: EncargoContent['crossLink'] }) {
  return (
    <div className={styles.root}>
      <Container>
        <Reveal>
          <CrossLink
            href={x.href}
            eyebrow={x.eyebrow}
            title={x.title}
            body={x.body}
            cue={x.cue}
            media={{ src: x.image, alt: x.imageAlt }}
            className={styles.block}
          />
        </Reveal>
      </Container>
    </div>
  );
}
