'use client';

import { useEffect, useRef, useState } from 'react';

const OPTIONS: IntersectionObserverInit = { threshold: 0.12, rootMargin: '0px 0px -8% 0px' };

/**
 * Returns a ref and whether the element has entered the viewport.
 * Disconnects after the first appearance.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Old browsers: show immediately (deferred so it doesn't render synchronously in the effect).
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, OPTIONS);
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}
