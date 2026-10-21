import 'server-only';
import { getEnv, isProduction } from '@/server/env';
import { createLogger, type Logger } from '@/server/log/logger';
import { ipBucket } from '@/server/http/client-ip';
import { jsonError } from '@/server/http/responses';
import { createMemoryLimiter } from './memory';
import { POLICIES, type PolicyName, type RateLimitIds, type Rule } from './policies';
import type { Limiter } from './types';
import { createRedis, createUpstashLimiter } from './upstash';

export type GuardResult = { ok: true } | { ok: false; response: Response; retryAfterSec: number };

export type GuardDeps = {
  /** Shared backend (Upstash). Null/absent means memory only. */
  createPrimary?: ((rule: Rule) => Limiter) | null;
  createMemory?: (rule: Rule) => Limiter;
  log?: Logger;
  production?: boolean;
  now?: () => number;
};

/**
 * Builds an enforceRateLimit function. Works in route handlers and server actions.
 * A failing primary limiter degrades to the per-instance memory limiter for that request (never a 500).
 */
export function createRateLimitGuard(deps: GuardDeps = {}) {
  const log = deps.log ?? createLogger();
  const makeMemory = deps.createMemory ?? ((r: Rule) => createMemoryLimiter({ limit: r.limit, windowMs: r.windowMs, now: deps.now }));
  const primaries = new Map<string, Limiter>();
  const memories = new Map<string, Limiter>();
  let warned = false;

  function memoryFor(rule: Rule): Limiter {
    let l = memories.get(rule.name);
    if (!l) memories.set(rule.name, (l = makeMemory(rule)));
    return l;
  }
  function primaryFor(rule: Rule): Limiter | null {
    if (!deps.createPrimary) {
      if (!warned) {
        warned = true;
        log[deps.production ? 'error' : 'warn']('ratelimit.fallback_memory', {
          reason: 'shared rate limit store not configured; limits are per instance',
        });
      }
      return null;
    }
    let l = primaries.get(rule.name);
    if (!l) primaries.set(rule.name, (l = deps.createPrimary(rule)));
    return l;
  }

  async function run(policy: PolicyName, ids: RateLimitIds, mode: 'limit' | 'peek'): Promise<GuardResult> {
    if (ids.ip) ids = { ...ids, ip: ipBucket(ids.ip) };
    let blockedMs = 0;
    for (const rule of POLICIES[policy] as readonly Rule[]) {
      const key = rule.key(ids);
      if (!key) continue;
      let limiter = primaryFor(rule) ?? memoryFor(rule);
      let result;
      try {
        result = await limiter[mode](key);
      } catch (err) {
        log.warn('ratelimit.backend_error', { rule: rule.name, error: err });
        limiter = memoryFor(rule);
        result = await limiter[mode](key);
      }
      if (!result.ok) blockedMs = Math.max(blockedMs, result.resetMs);
      if (!result.ok) break;
    }
    if (blockedMs === 0) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil(blockedMs / 1000));
    return { ok: false, retryAfterSec, response: jsonError(429, 'rate_limited', { retryAfter: retryAfterSec }) };
  }

  const enforceRateLimit = (policy: PolicyName, ids: RateLimitIds) => run(policy, ids, 'limit');
  /** Same verdict as enforceRateLimit, but records nothing (check first, consume only on failure). */
  const checkRateLimit = (policy: PolicyName, ids: RateLimitIds) => run(policy, ids, 'peek');
  return Object.assign(enforceRateLimit, { check: checkRateLimit });
}

let defaultGuard: ReturnType<typeof createRateLimitGuard> | undefined;

function getDefaultGuard(): ReturnType<typeof createRateLimitGuard> {
  if (!defaultGuard) {
    const { upstash } = getEnv();
    const redis = upstash ? createRedis(upstash.url, upstash.token) : null;
    defaultGuard = createRateLimitGuard({
      createPrimary: redis ? (rule) => createUpstashLimiter(redis, rule) : null,
      production: isProduction(),
    });
  }
  return defaultGuard;
}

export function enforceRateLimit(policy: PolicyName, ids: RateLimitIds): Promise<GuardResult> {
  return getDefaultGuard()(policy, ids);
}

/** Checks a policy without recording a hit. Pair with enforceRateLimit to count only some outcomes. */
export function checkRateLimit(policy: PolicyName, ids: RateLimitIds): Promise<GuardResult> {
  return getDefaultGuard().check(policy, ids);
}

/** Test helper. */
export function resetRateLimitGuard(): void {
  defaultGuard = undefined;
}
