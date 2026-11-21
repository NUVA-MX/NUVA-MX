'use client';

import { Children, useEffect, useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Rail.module.css';

type Props = {
  ariaLabel: string;
  itemWidth?: 'project';
  /** Endless sideways scroll: items repeat in both directions (no autoplay). The extra copies are hidden from assistive tech. */
  loop?: boolean;
  className?: string;
  children: ReactNode;
};

const DRAG_THRESHOLD = 5;
/** Loop mode renders the items three times and keeps the user in the middle copy. */
const COPIES = 3;
const SETTLE_MS = 120;

/** No animated scrolling for people who asked for reduced motion. */
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/**
 * Horizontal scroll-snap carousel. The first item lines up with the Container edge and the
 * rail bleeds to the right edge of the viewport. Arrow keys scroll one item; mouse drag scrolls.
 */
export function Rail({ ariaLabel, itemWidth = 'project', loop = false, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean; id: number } | null>(null);
  const suppressClick = useRef(false);

  function step(): number {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  }

  /** Width of one full set of items, so jumping by it lands on the identical item. */
  function setWidth(): number {
    return loop ? step() * Children.count(children) : 0;
  }

  /** Once the user rests in an outer copy, jump one set back to the middle copy (looks identical, snap stays aligned). */
  function recenter() {
    const el = ref.current;
    const w = setWidth();
    if (!el || w <= 0 || el.dataset.dragging) return;
    if (el.scrollLeft < w) el.scrollLeft += w;
    else if (el.scrollLeft >= 2 * w) el.scrollLeft -= w;
  }

  useLayoutEffect(() => {
    if (!loop || !ref.current) return;
    ref.current.scrollLeft = setWidth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);

  useEffect(() => {
    const el = ref.current;
    if (!loop || !el) return;
    let timer: number | undefined;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(recenter, SETTLE_MS);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in keys) {
      e.preventDefault();
      el.scrollBy({ left: keys[e.key] * step(), behavior: scrollBehavior() });
    } else if (e.key === 'Home') {
      e.preventDefault();
      el.scrollTo({ left: setWidth(), behavior: scrollBehavior() });
    } else if (e.key === 'End') {
      e.preventDefault();
      el.scrollTo({ left: loop ? setWidth() + step() * (Children.count(children) - 1) : el.scrollWidth, behavior: scrollBehavior() });
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) return;
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false, id: e.pointerId };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      d.moved = true;
      el.setPointerCapture(d.id);
      el.dataset.dragging = 'true';
    }
    if (d.moved) el.scrollLeft = d.left - dx;
  }

  function endDrag() {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || !el) return;
    if (d.moved) {
      suppressClick.current = true;
      if (el.hasPointerCapture(d.id)) el.releasePointerCapture(d.id);
      delete el.dataset.dragging;
      // Snap to the closest item after a drag.
      const s = step();
      if (s > 0) el.scrollTo({ left: Math.round(el.scrollLeft / s) * s, behavior: scrollBehavior() });
    }
  }

  function onClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  }

  return (
    <div
      ref={ref}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className={cx(styles.root, styles[itemWidth], className)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      {Array.from({ length: loop ? COPIES : 1 }, (_, copy) =>
        Children.map(children, (child, i) => {
          const clone = loop && copy !== 1;
          return (
            <div key={`${copy}-${i}`} className={styles.item} aria-hidden={clone ? true : undefined} inert={clone}>
              {child}
            </div>
          );
        }),
      )}
    </div>
  );
}
