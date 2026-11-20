'use client';

import { useEffect } from 'react';

const withoutHash = () => window.location.pathname + window.location.search;

/**
 * Reloading the page always starts at the top: the browser would otherwise restore the old scroll position, or jump to
 * the section named by a leftover #hash (for example #catalogo after clicking "Ver productos"). In-page links still
 * scroll to their section; the hash is just dropped from the URL afterwards. Back/forward navigation is untouched.
 */
export function ScrollReset() {
  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    // Stops the browser from re-applying the old position while the page is still growing; back/forward works again on leave.
    const restore = () => {
      window.history.scrollRestoration = 'auto';
    };
    const timers: number[] = [];
    let touched = false;
    const top = () => {
      if (!touched) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    const onUser = () => {
      touched = true;
    };
    if (nav?.type === 'reload') {
      window.history.scrollRestoration = 'manual';
      window.addEventListener('pagehide', restore, { once: true });
      if (window.location.hash) window.history.replaceState(null, '', withoutHash());
      top();
      // The page keeps growing as sections load and the browser can nudge the scroll meanwhile: stay at the top
      // until the visitor scrolls on their own.
      for (const ms of [100, 400, 1000, 2000]) timers.push(window.setTimeout(top, ms));
      for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.addEventListener(type, onUser, { once: true, passive: true });
    }
    // The browser scrolls to the anchor first; once it has, remove the hash so a reload does not jump there again.
    const onHashChange = () => {
      requestAnimationFrame(() => {
        if (window.location.hash) window.history.replaceState(null, '', withoutHash());
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('pagehide', restore);
      timers.forEach((t) => window.clearTimeout(t));
      for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.removeEventListener(type, onUser);
    };
  }, []);
  return null;
}
