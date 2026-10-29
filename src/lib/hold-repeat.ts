/** Wait before a held button starts repeating. */
export const HOLD_START_MS = 400;

/** Pause between repeats after the button has been held `heldMs`: about 8 steps/s, then 15/s after 1 s, 25/s after 2 s. */
export function holdInterval(heldMs: number): number {
  if (heldMs < 1000) return 125;
  if (heldMs < 2000) return 67;
  return 40;
}

export type HoldRepeat = { start: () => void; stop: () => void };

/**
 * Press-and-hold timing. `start` runs `step(true)` at once, then repeats `step(false)` after HOLD_START_MS, faster the
 * longer it is held. A step returns false when the limit is reached, which stops the repeat.
 */
export function createHoldRepeat(step: (first: boolean) => boolean): HoldRepeat {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let held = 0;

  function stop(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function tick(): void {
    timer = null;
    if (!step(false)) return;
    const wait = holdInterval(held);
    held += wait;
    timer = setTimeout(tick, wait);
  }

  return {
    start: () => {
      stop();
      if (!step(true)) return;
      held = HOLD_START_MS;
      timer = setTimeout(tick, HOLD_START_MS);
    },
    stop,
  };
}
