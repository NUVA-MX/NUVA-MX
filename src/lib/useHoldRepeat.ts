'use client';

import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { createHoldRepeat, type HoldRepeat } from '@/lib/hold-repeat';

type Options = {
  /** Current quantity. */
  value: number;
  direction: 1 | -1;
  /** Highest quantity ("+" stops there). */
  max: number;
  onChange: (next: number) => void;
};

export type HoldHandlers = {
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onBlur: () => void;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  onContextMenu: (e: MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Quantity button that also works held down. A pointer press changes the value at once and, if held, keeps going
 * (see hold-repeat.ts). "−" never repeats below 1, so a long hold cannot remove the line; a single press at 1 still
 * removes it. The next value is computed from the latest value (a ref), so fast repeats never skip or double count.
 * Keyboard (click with detail 0) does one step; the click that follows a pointer press is ignored.
 */
export function useHoldRepeat({ value, direction, max, onChange }: Options): HoldHandlers {
  const latest = useRef(value);
  const change = useRef(onChange);
  useEffect(() => {
    latest.current = value;
    change.current = onChange;
  });

  const hold = useRef<HoldRepeat | null>(null);
  useEffect(() => {
    const repeat = createHoldRepeat((first) => {
      const next = latest.current + direction;
      if (next > max) return false;
      if (next < (first ? 0 : 1)) return false;
      latest.current = next;
      change.current(next);
      return next < max && next > 0;
    });
    hold.current = repeat;
    return () => {
      repeat.stop();
      hold.current = null;
    };
  }, [direction, max]);

  const stop = () => hold.current?.stop();

  return {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      hold.current?.start();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onBlur: stop,
    onClick: (e) => {
      if (e.detail !== 0) return;
      const next = latest.current + direction;
      if (next < 0 || next > max) return;
      latest.current = next;
      change.current(next);
    },
    onContextMenu: (e) => e.preventDefault(),
  };
}
