import { cx } from '@/lib/cx';
import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import styles from './Marquee.module.css';

type Props = {
  text: string;
  /**
   * Copies of the text in each of the two identical halves of the track. Each half must be wider
   * than the viewport or a gap shows; 12 covers screens up to 3840px at the desktop size.
   */
  perHalf?: number;
  className?: string;
};

/**
 * Dark band with a phrase that scrolls continuously. Assistive tech reads the phrase once
 * (visually hidden); the moving track is aria-hidden. Static under prefers-reduced-motion.
 */
export function Marquee({ text, perHalf = 12, className }: Props) {
  const half = (key: string) => (
    <div className={styles.half} key={key}>
      {Array.from({ length: perHalf }, (_, i) => (
        <span className={styles.item} key={i}>
          {text}
        </span>
      ))}
    </div>
  );
  return (
    <div className={cx(styles.root, className)}>
      <VisuallyHidden as="p">{text}</VisuallyHidden>
      <div className={styles.track} aria-hidden="true">
        {half('a')}
        {half('b')}
      </div>
    </div>
  );
}
