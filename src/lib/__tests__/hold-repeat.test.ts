import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHoldRepeat, holdInterval, HOLD_START_MS } from '../hold-repeat';

describe('holdInterval', () => {
  it('speeds up the longer the button is held', () => {
    expect(holdInterval(400)).toBe(125);
    expect(holdInterval(1000)).toBe(67);
    expect(holdInterval(2000)).toBe(40);
  });
});

describe('createHoldRepeat', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('steps once at once and does not repeat before the start delay', () => {
    const step = vi.fn(() => true);
    createHoldRepeat(step).start();
    expect(step).toHaveBeenCalledTimes(1);
    expect(step).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(HOLD_START_MS - 1);
    expect(step).toHaveBeenCalledTimes(1);
  });

  it('a short press (stop before the delay) is a single step', () => {
    const step = vi.fn(() => true);
    const hold = createHoldRepeat(step);
    hold.start();
    vi.advanceTimersByTime(100);
    hold.stop();
    vi.advanceTimersByTime(5000);
    expect(step).toHaveBeenCalledTimes(1);
  });

  it('repeats at about 8 steps/s, then faster', () => {
    const step = vi.fn(() => true);
    createHoldRepeat(step).start();
    vi.advanceTimersByTime(HOLD_START_MS);
    expect(step).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(125 * 4);
    expect(step).toHaveBeenCalledTimes(6);
    const before = step.mock.calls.length;
    vi.advanceTimersByTime(2000);
    // between 1 s and 3 s of holding the pace is 67 ms then 40 ms: well above the first 8/s pace
    expect(step.mock.calls.length - before).toBeGreaterThan(30);
  });

  it('stops by itself when a step reports the limit', () => {
    let left = 3;
    const step = vi.fn(() => --left > 0);
    createHoldRepeat(step).start();
    vi.advanceTimersByTime(10_000);
    expect(step).toHaveBeenCalledTimes(3);
  });

  it('does not repeat when the first step already hit the limit, and stop is idempotent', () => {
    const step = vi.fn(() => false);
    const hold = createHoldRepeat(step);
    hold.start();
    vi.advanceTimersByTime(5000);
    hold.stop();
    hold.stop();
    expect(step).toHaveBeenCalledTimes(1);
  });

  it('a new press restarts cleanly', () => {
    const step = vi.fn(() => true);
    const hold = createHoldRepeat(step);
    hold.start();
    vi.advanceTimersByTime(HOLD_START_MS + 125);
    hold.stop();
    const calls = step.mock.calls.length;
    hold.start();
    expect(step).toHaveBeenCalledTimes(calls + 1);
    expect(step).toHaveBeenLastCalledWith(true);
  });
});
