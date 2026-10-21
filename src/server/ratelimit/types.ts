import 'server-only';

export type LimitResult = {
  ok: boolean;
  remaining: number;
  /** Milliseconds until the caller may try again (or until the window frees a slot). */
  resetMs: number;
};

export interface Limiter {
  /** Records a hit and reports whether it was allowed. */
  limit(key: string): Promise<LimitResult>;
  /** Reports whether a hit would be allowed, without recording one. */
  peek(key: string): Promise<LimitResult>;
}

export type RuleSpec = { name: string; limit: number; windowMs: number };
