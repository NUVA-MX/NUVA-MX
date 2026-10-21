import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Limiter, LimitResult, RuleSpec } from './types';

/** Sliding-window limiter backed by Upstash Redis (shared across serverless instances). */
export function createUpstashLimiter(redis: Redis, rule: RuleSpec): Limiter {
  const seconds = Math.max(1, Math.round(rule.windowMs / 1000));
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rule.limit, `${seconds} s`),
    prefix: `nuva:rl:${rule.name}`,
    timeout: 1500,
    analytics: false,
  });
  return {
    async limit(key: string): Promise<LimitResult> {
      const r = await rl.limit(key);
      return { ok: r.success, remaining: r.remaining, resetMs: Math.max(1, r.reset - Date.now()) };
    },
    async peek(key: string): Promise<LimitResult> {
      const r = await rl.getRemaining(key);
      return { ok: r.remaining > 0, remaining: r.remaining, resetMs: Math.max(1, r.reset - Date.now()) };
    },
  };
}

export function createRedis(url: string, token: string): Redis {
  return new Redis({ url, token });
}
