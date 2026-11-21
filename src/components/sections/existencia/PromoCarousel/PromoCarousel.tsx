'use client';

import { useCallback, useRef } from 'react';
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

type Props = { content: PromoCarouselContent; title: string; lead: string };

function Chevron({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cx(flip && styles.flip)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Promocionales photo rail: endless Rail (snap, arrow keys, drag) plus prev/next buttons. No autoplay. */
export function PromoCarousel({ content, title, lead }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const scroller = useCallback(() => wrap.current?.querySelector<HTMLElement>('[role="region"]') ?? null, []);

  function go(dir: 1 | -1) {
    const el = scroller();
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * (first.getBoundingClientRect().width + gap), behavior: reduced ? 'auto' : 'smooth' });
  }

  return (
    <section className={styles.root} ref={wrap} aria-labelledby="promo-projects-title">
      <div className={styles.head}>
        <h2 id="promo-projects-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.lead}>{lead}</p>
      </div>
      <Rail ariaLabel={content.ariaLabel} className={styles.rail} loop>
        {content.slides.map((slide, i) => (
          <div key={i} className={styles.card}>
            <Media src={slide.image} alt={slide.imageAlt} ratio="4/5" radius="card" sizes="promoCarousel" className={styles.media} />
          </div>
        ))}
      </Rail>
      <div className={styles.controls}>
        <button type="button" className={styles.button} aria-label={content.prev} onClick={() => go(-1)}>
          <Chevron flip />
        </button>
        <button type="button" className={styles.button} aria-label={content.next} onClick={() => go(1)}>
          <Chevron />
        </button>
      </div>
    </section>
  );
}
