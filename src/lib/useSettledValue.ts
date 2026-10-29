'use client';

import { useEffect, useState } from 'react';

/** The value after it has stopped changing for `delayMs` (for screen reader announcements while a button repeats). */
export function useSettledValue<T>(value: T, delayMs = 500): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
