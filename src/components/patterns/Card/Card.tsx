import type { ElementType, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Card.module.css';

type Props = {
  as?: ElementType;
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * Surface with the main radius and shadow. With `interactive` it scales on hover and when
 * a child has keyboard focus. Clicks are handled by a real button/link inside the card.
 */
export function Card({ as: Tag = 'div', interactive = false, className, children }: Props) {
  return <Tag className={cx(styles.root, interactive && styles.interactive, className)}>{children}</Tag>;
}
