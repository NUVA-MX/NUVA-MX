import { cx } from '@/lib/cx';
import styles from './StepList.module.css';

export type Step = { n: string; title: string; body: string };

type Props = { steps: readonly Step[]; tone?: 'default' | 'inverse'; className?: string };

export function StepList({ steps, tone = 'inverse', className }: Props) {
  return (
    <ol className={cx(styles.root, styles[tone], className)}>
      {steps.map((step) => (
        <li key={step.n} className={styles.step}>
          <span className={styles.n} aria-hidden="true">
            {step.n}
          </span>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.body}>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
