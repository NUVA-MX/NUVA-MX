'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { cx } from '@/lib/cx';
import { useModeTransition } from '@/lib/useModeTransition';
import styles from './ModeSwitch.module.css';

export type ModeOption = { key: string; label: string; href: string };

type Props = {
  options: readonly ModeOption[];
  /** Key of the active option. Comes from the URL, so back/forward stay correct. */
  current: string;
  ariaLabel: string;
  className?: string;
  /** Called inside the transition, before the new page has loaded: flip the UI to `key` right away. */
  onOptimistic: (key: string) => void;
};

/**
 * Pill switch between the two sides. A thumb slides under the active option (measured, so it holds at any
 * font size or breakpoint) and the page change runs the circle wipe from the exact click or tap point.
 */
export function ModeSwitch({ options, current, ariaLabel, className, onOptimistic }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const { go, prefetch } = useModeTransition();

  const measure = useCallback(() => {
    const el = buttons.current.get(current);
    if (el) setThumb((t) => (t && t.x === el.offsetLeft && t.w === el.offsetWidth ? t : { x: el.offsetLeft, w: el.offsetWidth }));
  }, [current]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    buttons.current.forEach((b) => ro.observe(b));
    return () => ro.disconnect();
  }, [measure]);

  // Warm the other route so the new page is ready when the wipe starts.
  useEffect(() => {
    options.forEach((o) => {
      if (o.key !== current) prefetch(o.href);
    });
  }, [options, current, prefetch]);

  const onClick = (e: MouseEvent<HTMLButtonElement>, opt: ModeOption) => {
    if (opt.key === current) return;
    // detail === 0: activated from the keyboard, so start from the middle of the button.
    const rect = e.currentTarget.getBoundingClientRect();
    const origin =
      e.detail === 0
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: e.clientX, y: e.clientY };
    go(opt.href, origin, () => onOptimistic(opt.key));
  };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={ariaLabel}
      data-ready={thumb ? '' : undefined}
      className={cx(styles.root, className)}
    >
      <span
        className={styles.thumb}
        aria-hidden="true"
        style={thumb ? { transform: `translateX(${thumb.x}px)`, width: thumb.w } : undefined}
      />
      {options.map((opt) => {
        const isCurrent = opt.key === current;
        return (
          <button
            key={opt.key}
            ref={(el) => {
              if (el) buttons.current.set(opt.key, el);
              else buttons.current.delete(opt.key);
            }}
            type="button"
            aria-pressed={isCurrent}
            className={cx(styles.option, isCurrent && styles.current)}
            onClick={(e) => onClick(e, opt)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
