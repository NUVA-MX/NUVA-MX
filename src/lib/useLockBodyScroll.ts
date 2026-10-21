'use client';

import { useEffect } from 'react';

let locks = 0;
let previous: { overflow: string; paddingRight: string } | null = null;

/** Locks body scroll while `locked` is true. Nested locks are reference-counted. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement } = document;
    if (locks === 0) {
      const scrollbar = window.innerWidth - documentElement.clientWidth;
      previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      body.style.overflow = 'hidden';
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks === 0 && previous) {
        body.style.overflow = previous.overflow;
        body.style.paddingRight = previous.paddingRight;
        previous = null;
      }
    };
  }, [locked]);
}
