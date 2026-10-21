'use client';

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { fillTemplate } from '@/lib/format';
import { Icon } from '@/components/primitives/Icon';
import styles from './Carousel.module.css';

export type CarouselLabels = {
  /** aria-roledescription of the whole carousel, e.g. "carrusel". */
  carousel: string;
  /** aria-roledescription of each slide, e.g. "foto". */
  slideRole: string;
  /** Accessible name of each slide; {n} and {total} are replaced. */
  slide: string;
  /** Accessible name of each dot; {n} is replaced. */
  goToSlide: string;
  previous: string;
  next: string;
};

type Props = {
  /** Accessible name of the carousel. */
  label: string;
  labels: CarouselLabels;
  slides: readonly ReactNode[];
  className?: string;
};

/**
 * Single-slide carousel (APG pattern, no autoplay): previous/next arrows, dots, ArrowLeft/ArrowRight
 * while focus is inside, wrap-around. Only the current slide is exposed; the others are
 * aria-hidden and inert. The frame ratio and arrow placement come from the CSS module.
 */
export function Carousel({ label, labels, slides, className }: Props) {
  const [index, setIndex] = useState(0);
  const dotsRef = useRef<HTMLDivElement>(null);
  const total = slides.length;

  function go(to: number, focusDot = false) {
    const next = (to + total) % total;
    setIndex(next);
    if (focusDot) {
      const dot = dotsRef.current?.querySelectorAll<HTMLButtonElement>('button')[next];
      dot?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const onDot = dotsRef.current?.contains(document.activeElement) ?? false;
    go(index + (e.key === 'ArrowRight' ? 1 : -1), onDot);
  }

  return (
    <section
      aria-roledescription={labels.carousel}
      aria-label={label}
      className={cx(styles.root, className)}
      onKeyDown={onKeyDown}
    >
      <div className={styles.viewport}>
        <div className={styles.track} style={{ '--carousel-index': index } as CSSProperties} aria-live="polite">
          {slides.map((slide, i) => {
            const current = i === index;
            return (
              <div
                key={i}
                role="group"
                aria-roledescription={labels.slideRole}
                aria-label={fillTemplate(labels.slide, { n: i + 1, total })}
                aria-hidden={current ? undefined : true}
                inert={!current}
                className={styles.slide}
              >
                {slide}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className={cx(styles.arrow, styles.prev)}
          aria-label={labels.previous}
          onClick={() => go(index - 1)}
        >
          <Icon name="arrow" size="md" className={styles.flip} />
        </button>
        <button type="button" className={cx(styles.arrow, styles.next)} aria-label={labels.next} onClick={() => go(index + 1)}>
          <Icon name="arrow" size="md" />
        </button>
      </div>
      <div className={styles.dots} ref={dotsRef}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={styles.dot}
            aria-label={fillTemplate(labels.goToSlide, { n: i + 1 })}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  );
}
