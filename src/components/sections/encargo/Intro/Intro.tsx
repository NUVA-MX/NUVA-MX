import { Container } from '@/components/primitives/Container';
import { Reveal } from '@/components/patterns/Reveal';
import { encargo } from '@/content/encargo';
import styles from './Intro.module.css';

/** Centered serif paragraph; the key phrases are <strong> (marked in content). */
export function Intro() {
  return (
    <div className={styles.root}>
      <Container>
        <Reveal>
          <p className={styles.text}>
            {encargo.intro.parts.map((part, i) =>
              part.strong ? (
                <strong key={i} className={styles.strong}>
                  {part.text}
                </strong>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </p>
        </Reveal>
      </Container>
    </div>
  );
}
