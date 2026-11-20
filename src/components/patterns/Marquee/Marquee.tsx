import Image from 'next/image';
import { cx } from '@/lib/cx';
import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import styles from './Marquee.module.css';

export type MarqueeImage = { src: string; width: number; height: number };

type Props = {
  text: string;
  /** Brand ribbon repeated in place of the phrase; `text` is still what assistive tech reads. */
  image?: MarqueeImage;
  /** Logos that alternate along the strip, in place of the phrase; `text` is still what assistive tech reads. */
  images?: MarqueeImage[];
  /** Promocionales-blue band with dark artwork instead of the dark band. */
  light?: boolean;
  /**
   * Copies of the text in each of the two identical halves of the track. Each half must be wider
   * than the viewport or a gap shows; 12 covers screens up to 3840px at the desktop size.
   */
  perHalf?: number;
  className?: string;
};

/**
 * Dark band with a phrase (or a brand ribbon image) that scrolls continuously. Assistive tech reads the phrase once
 * (visually hidden); the moving track is aria-hidden. Static under prefers-reduced-motion.
 */
export function Marquee({ text, image, images, light, perHalf = images ? 16 : image ? 6 : 12, className }: Props) {
  const art = images ? (i: number) => images[i % images.length] : image ? () => image : null;
  const half = (key: string) => (
    <div className={styles.half} key={key}>
      {Array.from({ length: perHalf }, (_, i) => (
        <span className={art ? (images ? styles.logo : styles.ribbon) : styles.item} key={i}>
          {art ? (
            <Image src={art(i).src} alt="" width={art(i).width} height={art(i).height} className={images ? styles.logoImg : styles.img} />
          ) : (
            text
          )}
        </span>
      ))}
    </div>
  );
  return (
    <div className={cx(styles.root, light && styles.light, className)}>
      <VisuallyHidden as="p">{text}</VisuallyHidden>
      <div className={styles.track} aria-hidden="true">
        {half('a')}
        {half('b')}
      </div>
    </div>
  );
}
