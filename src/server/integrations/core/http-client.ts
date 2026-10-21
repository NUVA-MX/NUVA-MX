import 'server-only';
import { audit as defaultAudit, type AuditFn } from '@/server/audit/audit';
import { createLogger, type Logger } from '@/server/log/logger';
import { assertAllowedUrl } from './allowlist';
import { createBreakerRegistry, type BreakerRegistry } from './circuit-breaker';
import { IntegrationError } from './errors';
import { backoffMs, canRetryMethod, isRetryableStatus, MAX_RETRY_AFTER_MS, parseRetryAfter } from './retry';
import type { CallOptions, HttpClient } from './types';

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 2;
const MAX_RETRIES = 5;
const DEFAULT_MAX_BYTES = 1024 * 1024;

export type HttpClientDeps = {
  /** Inject in tests. Defaults to the global fetch (this file is the only place allowed to use it). */
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  breakers?: BreakerRegistry;
  audit?: AuditFn;
  log?: Logger;
};

type AttemptFailure = { error: IntegrationError; retryable: boolean; breakerFailure: boolean };

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel().catch(() => undefined);
    throw new IntegrationError('too_large', 'response body exceeds the size limit');
  }
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new IntegrationError('too_large', 'response body exceeds the size limit');
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** The only outbound HTTP path of the app. Everything else must go through this. */
export function createHttpClient(deps: HttpClientDeps = {}): HttpClient {
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const random = deps.random ?? Math.random;
  const breakers = deps.breakers ?? createBreakerRegistry({ now });
  const audit = deps.audit ?? defaultAudit;
  const log = deps.log ?? createLogger();

  return {
    async request<T>(o: CallOptions<T>): Promise<T> {
      const providerName = o.provider.name;
      const url = assertAllowedUrl(o.url, o.provider.allowedHosts, providerName);
      const fetchFn = deps.fetchImpl ?? globalThis.fetch;
      const timeoutMs = clamp(o.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1, MAX_TIMEOUT_MS);
      const maxRetries = clamp(Math.floor(o.retries ?? DEFAULT_RETRIES), 0, MAX_RETRIES);
      const maxBytes = o.maxResponseBytes ?? DEFAULT_MAX_BYTES;
      const retriesAllowed = canRetryMethod(o.method, Boolean(o.idempotencyKey));
      const breaker = breakers.get(providerName);
      const where = { provider: providerName, method: o.method, host: url.host, path: url.pathname };

      const headers: Record<string, string> = { accept: 'application/json', ...o.headers };
      let body: string | undefined;
      if (o.body !== undefined) {
        body = typeof o.body === 'string' ? o.body : JSON.stringify(o.body);
        if (typeof o.body !== 'string') headers['content-type'] ??= 'application/json';
      }
      if (o.idempotencyKey) headers['idempotency-key'] = o.idempotencyKey;

      const fail = async (error: IntegrationError, attempts: number): Promise<never> => {
        await audit({
          actorType: 'integration',
          actorId: providerName,
          action: 'integration.call_failed',
          target: `${url.host}${url.pathname}`,
          outcome: 'failure',
          metadata: { kind: error.kind, status: error.status, method: o.method, attempts },
        });
        throw error;
      };

      for (let attempt = 0; ; attempt++) {
        if (!breaker.acquire()) {
          log.warn('integration.circuit_open', { ...where, attempt });
          throw new IntegrationError('circuit_open', `circuit open for provider ${providerName}`, { provider: providerName });
        }

        const started = now();
        let failure: AttemptFailure | undefined;
        let text = '';
        let status: number | undefined;
        const signal = AbortSignal.timeout(timeoutMs);

        try {
          const res = await fetchFn(url.href, { method: o.method, headers, body, redirect: 'manual', signal, cache: 'no-store' });
          status = res.status;
          if (status >= 300 && status < 400) {
            await res.body?.cancel().catch(() => undefined);
            failure = {
              error: new IntegrationError('http', 'unexpected redirect (redirects are never followed)', { provider: providerName, status }),
              retryable: false,
              breakerFailure: false,
            };
          } else if (status >= 400) {
            await res.body?.cancel().catch(() => undefined);
            const retryAfterMs = parseRetryAfter(res.headers.get('retry-after'), now());
            failure = {
              error: new IntegrationError('http', `provider responded with status ${status}`, { provider: providerName, status, retryAfterMs }),
              retryable: isRetryableStatus(status),
              breakerFailure: status >= 500 || status === 429,
            };
          } else {
            text = await readCapped(res, maxBytes);
          }
        } catch (err) {
          if (err instanceof IntegrationError) {
            failure = { error: err, retryable: false, breakerFailure: false };
          } else if (signal.aborted) {
            failure = {
              error: new IntegrationError('timeout', `request timed out after ${timeoutMs}ms`, { provider: providerName }),
              retryable: true,
              breakerFailure: true,
            };
          } else {
            failure = {
              error: new IntegrationError('http', 'network error', { provider: providerName, cause: err }),
              retryable: true,
              breakerFailure: true,
            };
          }
        }

        log.info('integration.call', { ...where, status, durationMs: now() - started, attempt: attempt + 1, ok: !failure });

        if (!failure) {
          breaker.recordSuccess();
          let json: unknown;
          try {
            json = text === '' ? undefined : JSON.parse(text);
          } catch (err) {
            return fail(new IntegrationError('parse', 'response is not valid JSON', { provider: providerName, cause: err }), attempt + 1);
          }
          const parsed = o.schema.safeParse(json);
          if (!parsed.success) {
            return fail(new IntegrationError('parse', 'response does not match the expected schema', { provider: providerName }), attempt + 1);
          }
          return parsed.data;
        }

        if (failure.breakerFailure) {
          if (breaker.recordFailure()) {
            log.error('integration.circuit_opened', where);
            await audit({
              actorType: 'integration',
              actorId: providerName,
              action: 'integration.circuit_open',
              target: providerName,
              outcome: 'failure',
              metadata: { kind: failure.error.kind, status: failure.error.status },
            });
          }
        } else {
          breaker.recordSuccess(); // the provider answered; releases a half-open probe
        }

        const { retryAfterMs } = failure.error;
        const giveUp =
          !failure.retryable ||
          !retriesAllowed ||
          attempt >= maxRetries ||
          (retryAfterMs !== undefined && retryAfterMs > MAX_RETRY_AFTER_MS);
        if (giveUp) return fail(failure.error, attempt + 1);

        await sleep(retryAfterMs ?? backoffMs(attempt, random));
      }
    },
  };
}

let shared: HttpClient | undefined;

/** Shared application http-client. */
export function getHttpClient(): HttpClient {
  return (shared ??= createHttpClient());
}
