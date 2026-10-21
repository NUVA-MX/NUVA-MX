'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Visible once the sentinel (placed right after the hero) has scrolled above the viewport, and hidden again while any
 * `[data-hide-sticky]` block or the page footer is on screen, so the button never covers a call to action or the footer.
 */
export function useStickyVisible(): { sentinelRef: RefObject<HTMLDivElement | null>; visible: boolean } {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // A zero-height sentinel can jump past the viewport between two frames and never "intersect", so the hero check
    // reads its position on scroll (passive, one read per frame) instead of using an observer.
    let frame = 0;
    const check = () => {
      frame = 0;
      setPastHero(sentinel.getBoundingClientRect().top < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });

    const targets = Array.from(document.querySelectorAll('[data-hide-sticky], footer'));
    const onScreen = new Set<Element>();
    const blockObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setBlocked(onScreen.size > 0);
    });
    targets.forEach((el) => blockObserver.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      blockObserver.disconnect();
    };
  }, []);

  return { sentinelRef, visible: pastHero && !blocked };
}
