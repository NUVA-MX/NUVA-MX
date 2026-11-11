'use client';

import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';

/** Point the wipe starts from, in viewport (client) coordinates. */
export type WipeOrigin = { x: number; y: number };

/**
 * Switches page with a circle wipe from `origin` (CSS in styles/mode-transition.css).
 *
 * The wipe starts on the click, without waiting for the server: `optimistic()` flips the UI to the target side
 * (brand color, nav, a skeleton in place of the content) inside the transition, while `router.push` loads the
 * real page in parallel and replaces the skeleton when it arrives. Without View Transitions, or with reduced
 * motion, the same optimistic flip happens with no wipe (the brand color fades through CSS).
 * Repeat calls while a transition is running are ignored.
 */
export function useModeTransition() {
  const router = useRouter();
  const busy = useRef(false);

  const prefetch = useCallback((href: string) => router.prefetch(href), [router]);

  const go = useCallback(
    (href: string, origin: WipeOrigin, optimistic: () => void) => {
      if (busy.current) return;
      const commit = () => {
        flushSync(optimistic);
        router.push(href);
      };
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduce) {
        commit();
        return;
      }
      busy.current = true;
      const root = document.documentElement;
      // Farthest corner of the visible viewport (visualViewport follows the iOS Safari address bar).
      const vv = window.visualViewport;
      const w = Math.max(vv?.width ?? 0, window.innerWidth);
      const h = Math.max(vv?.height ?? 0, window.innerHeight);
      const r = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y));
      root.style.setProperty('--vt-x', `${origin.x}px`);
      root.style.setProperty('--vt-y', `${origin.y}px`);
      root.style.setProperty('--vt-r', `${Math.ceil(r)}px`);
      root.dataset.modeSwitching = '';

      const transition = document.startViewTransition(commit);
      const release = () => {
        busy.current = false;
        delete root.dataset.modeSwitching;
      };
      transition.finished.then(release, release);
    },
    [router],
  );

  return { go, prefetch };
}
