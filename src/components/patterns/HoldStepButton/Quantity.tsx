'use client';

import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import { useSettledValue } from '@/lib/useSettledValue';

type Props = { value: number; className?: string };

/** Quantity text. Screen readers hear the value once it settles, not on every tick of a held button. */
export function Quantity({ value, className }: Props) {
  const settled = useSettledValue(value);
  return (
    <>
      <output className={className} aria-hidden="true">
        {value}
      </output>
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {settled}
        </span>
      </VisuallyHidden>
    </>
  );
}
