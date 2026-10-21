import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Reveal } from '@/components/patterns/Reveal';
import { encargo } from '@/content/encargo';
import type { ProcesoStep as StepData } from '@/content/encargo-proceso';
import { site } from '@/content/site';
import { ProcesoCta } from './ProcesoCta';
import { ProcesoStep } from './ProcesoStep';
import styles from './Proceso.module.css';

/**
 * Backbone of the page: the process as an ordered list of steps. Each step pairs a photo slot (a tinted block with the
 * step icon until the client supplies photos) with a number and a short text. The only way to order is a message,
 * so links to WhatsApp sit inside the steps and the closing panel holds the main call to action.
 */
export function Proceso() {
  const p = encargo.proceso;
  const steps: readonly StepData[] = p.steps;
  return (
    <section id="proceso" className={styles.root} aria-labelledby="proceso-title">
      <Container>
        <Reveal className={styles.head}>
          <Eyebrow size="sm" tracking="label">
            {p.eyebrow}
          </Eyebrow>
          <Heading level={2} size="2xl" id="proceso-title" className={styles.title}>
            {p.title}
          </Heading>
          <p className={styles.lead}>{p.lead}</p>
        </Reveal>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <ProcesoStep
              key={step.id}
              step={step}
              index={i}
              isLast={i === steps.length - 1}
              stepLabel={p.stepLabel}
              phone={site.whatsapp.phone}
            />
          ))}
        </ol>
        <ProcesoCta />
      </Container>
    </section>
  );
}
