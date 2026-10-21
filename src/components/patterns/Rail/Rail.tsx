'use client';

import { Children, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Rail.module.css';

type Props = {
  ariaLabel: string;
  itemWidth?: 'project';
  className?: string;
  children: ReactNode;
};

const DRAG_THRESHOLD = 5;

/**
 * Horizontal scroll-snap carousel. The first item lines up with the Container edge and the
 * rail bleeds to the right edge of the viewport. Arrow keys scroll one item; mouse drag scrolls.
 */
export function Rail({ ariaLabel, itemWidth = 'project', className, children }: Props) {
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

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in keys) {
      e.preventDefault();
      el.scrollBy({ left: keys[e.key] * step(), behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
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
      if (s > 0) el.scrollTo({ left: Math.round(el.scrollLeft / s) * s, behavior: 'smooth' });
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
      {Children.map(children, (child) => (
        <div className={styles.item}>{child}</div>
      ))}
    </div>
  );
}
