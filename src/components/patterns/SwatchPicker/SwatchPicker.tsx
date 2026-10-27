'use client';

import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { cx } from '@/lib/cx';
import styles from './SwatchPicker.module.css';

export type SwatchOption = {
  value: string;
  /** Tone name: the accessible name of the swatch. */
  label: string;
  /** Validated "#RRGGBB" or null (neutral fill). */
  hex: string | null;
  disabled?: boolean;
};

type Props = {
  options: readonly SwatchOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Accessible name of the group. */
  label: string;
  className?: string;
};

/**
 * Color choice as a radiogroup: arrow keys move the selection (skipping disabled swatches), Home/End jump,
 * one tab stop. Each swatch is named by its tone, so color is never the only information.
 */
export function SwatchPicker({ options, value, onChange, label, className }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.flatMap((o, i) => (o.disabled ? [] : [i]));
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : (enabled[0] ?? -1);

  function move(from: number, step: 1 | -1 | 'first' | 'last') {
    if (enabled.length === 0) return;
    const at = enabled.indexOf(from);
    const target =
      step === 'first' ? enabled[0] : step === 'last' ? enabled[enabled.length - 1] : enabled[(at + step + enabled.length) % enabled.length];
    refs.current[target]?.focus();
    onChange(options[target].value);
  }

  function onKeyDown(e: KeyboardEvent, index: number) {
    const keys: Record<string, 1 | -1 | 'first' | 'last'> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      Home: 'first',
      End: 'last',
    };
    const step = keys[e.key];
    if (step === undefined) return;
    e.preventDefault();
    move(index, step);
  }

  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.root, className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.label}
          title={o.label}
          disabled={o.disabled}
          tabIndex={i === tabStop ? 0 : -1}
          className={cx(styles.swatch, o.hex === null && styles.neutral, o.disabled && styles.out)}
          style={o.hex ? ({ '--swatch-color': o.hex } as CSSProperties) : undefined}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
        />
      ))}
    </div>
  );
}
