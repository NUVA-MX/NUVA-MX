'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Rail } from '@/components/patterns/Rail';
import { Media } from '@/components/primitives/Media';
import { cx } from '@/lib/cx';
import styles from './PromoCarousel.module.css';

export type PromoCarouselContent = {
  ariaLabel: string;
  prev: string;
  next: string;
  slides: { image: string | null; imageAlt: string }[];
};

type Props = { content: PromoCarouselContent };

function Chevron({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cx(flip && styles.flip)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Promocionales photo rail: Rail (snap, arrow keys, drag) plus prev/next buttons. No autoplay. */
export function PromoCarousel({ content }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const scroller = useCallback(() => wrap.current?.querySelector<HTMLElement>('[role="region"]') ?? null, []);

  const update = useCallback(() => {
    const el = scroller();
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  }, [scroller]);

  useEffect(() => {
    const el = scroller();
    if (!el) return;
    const raf = requestAnimationFrame(update);
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [scroller, update]);

  function go(dir: 1 | -1) {
    const el = scroller();
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * (first.getBoundingClientRect().width + gap), behavior: reduced ? 'auto' : 'smooth' });
  }

  return (
    <section className={styles.root} ref={wrap}>
      <Rail ariaLabel={content.ariaLabel} className={styles.rail}>
        {content.slides.map((slide, i) => (
          <div key={i} className={styles.card}>
            <Media src={slide.image} alt={slide.imageAlt} ratio="4/5" radius="card" sizes="promoCarousel" className={styles.media} />
          </div>
        ))}
      </Rail>
      <div className={styles.controls}>
        <button type="button" className={styles.button} aria-label={content.prev} disabled={edge.start} onClick={() => go(-1)}>
          <Chevron flip />
        </button>
        <button type="button" className={styles.button} aria-label={content.next} disabled={edge.end} onClick={() => go(1)}>
          <Chevron />
        </button>
      </div>
    </section>
  );
}
