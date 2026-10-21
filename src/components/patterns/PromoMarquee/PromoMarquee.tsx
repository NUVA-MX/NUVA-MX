'use client';

import { useEffect, useState } from 'react';
import { marqueeAt, type PromoWindow } from '@/lib/content/encargo-merge';
import { Marquee } from '../Marquee';

export type PromoMarqueeProps = {
  defaultText: string;
  /** Text the server chose when it rendered the page (first client render uses it: no hydration mismatch). */
  serverText: string;
  /** Promo window as ISO strings; only sent when active or starting within 10 minutes. */
  promo: { text: string; startsAt: string | null; endsAt: string | null } | null;
};

/** Longest delay setTimeout accepts (2^31 - 1 ms). Longer waits re-check in steps. */
export const MAX_TIMEOUT_MS = 2_147_483_647;

function toWindow(promo: NonNullable<PromoMarqueeProps['promo']>): PromoWindow {
  return {
    text: promo.text,
    startsAt: promo.startsAt ? new Date(promo.startsAt) : null,
    endsAt: promo.endsAt ? new Date(promo.endsAt) : null,
  };
}

/**
 * Marquee with a client-side guard around the promo window. The page is cached (ISR, 5 min), so a promo that
 * starts or ends between revalidations is switched here, at the exact boundary, without a reload.
 */
export function PromoMarquee({ defaultText, serverText, promo }: PromoMarqueeProps) {
  const [text, setText] = useState(serverText);

  useEffect(() => {
    if (!promo) return;
    const window = toWindow(promo);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const state = marqueeAt(defaultText, window, new Date());
      setText(state.text);
      if (state.nextBoundary) {
        const delay = Math.min(Math.max(state.nextBoundary.getTime() - Date.now(), 0), MAX_TIMEOUT_MS);
        // +1 ms so the re-check lands just after the boundary instant.
        timer = setTimeout(tick, delay + 1);
      }
    };
    tick();
    return () => clearTimeout(timer);
  }, [defaultText, promo]);

  return <Marquee text={text} />;
}
