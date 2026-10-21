import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Text } from '@/components/primitives/Text';
import styles from './CtaBand.module.css';

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleId?: string;
  body?: ReactNode;
  actions?: ReactNode;
  /** Content under the actions (e.g. an InfoGrid). */
  children?: ReactNode;
};

/** Centered contact block. The section background comes from the page. */
export function CtaBand({ eyebrow, title, titleId, body, actions, children }: Props) {
  return (
    <div className={styles.root}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading level={2} size="2xl" id={titleId} className={styles.title}>
        {title}
      </Heading>
      {body && (
        <Text size="xl" leading="lead" className={styles.body}>
          {body}
        </Text>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
      {children && <div className={styles.extra}>{children}</div>}
    </div>
  );
}
