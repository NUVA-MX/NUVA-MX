import 'server-only';
import { audit as defaultAudit, type AuditFn } from '@/server/audit/audit';
import { getEnv, type Env } from '@/server/env';
import { jsonError, jsonOk } from '@/server/http/responses';
import { contextFromHeaders } from '@/server/http/request-context';
import { createLogger, type Logger } from '@/server/log/logger';
import { enforceRateLimit as defaultEnforce, type GuardResult } from '@/server/ratelimit/guard';
import type { PolicyName } from '@/server/ratelimit/policies';
import { IntegrationError } from './core/errors';
import type { Registry } from './core/registry';
import { getWebhookEventStore, type WebhookEventStore } from './core/webhooks';

export const MAX_WEBHOOK_BYTES = 256 * 1024;

export type InboundDeps = {
  registry: Registry;
  getEnv?: () => Env;
  store?: () => WebhookEventStore;
  enforceRateLimit?: (policy: PolicyName, ids: { ip?: string; provider?: string }) => Promise<GuardResult>;
  audit?: AuditFn;
  log?: Logger;
};

class TooLargeError extends Error {}

async function readBodyCapped(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new TooLargeError();
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

/**
 * Inbound webhook pipeline: provider lookup (404) -> rate limit (429) -> content type (415) -> size (413)
 * -> signature (401, generic) -> dedupe (200 duplicate; 503 when no shared store) -> handler (200).
 * Never calls an outbound API.
 */
export function createInboundHandler(deps: InboundDeps) {
  const log = deps.log ?? createLogger();
  const audit = deps.audit ?? defaultAudit;
  const enforce = deps.enforceRateLimit ?? defaultEnforce;

  return async function handleInboundWebhook(request: Request, providerName: string): Promise<Response> {
    const env = (deps.getEnv ?? getEnv)();
    const provider = deps.registry.getProvider(providerName, env);
    // Unknown, disabled or webhook-less providers are indistinguishable from any other 404.
    if (!provider?.webhook) return jsonError(404, 'not_found');

    const ctx = contextFromHeaders(request.headers);
    const reject = async (status: number, code: string, reason: string) => {
      await audit({
        actorType: 'webhook',
        actorId: provider.name,
        action: 'webhook.rejected',
        outcome: 'denied',
        ip: ctx.ip,
        requestId: ctx.requestId,
        metadata: { reason, status },
      });
      return jsonError(status, code);
    };

    const limited = await enforce('webhook', { ip: ctx.ip, provider: provider.name });
    if (!limited.ok) {
      log.warn('webhook.rate_limited', { provider: provider.name, requestId: ctx.requestId });
      return limited.response;
    }

    const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (contentType !== 'application/json') return reject(415, 'unsupported_media_type', 'content_type');

    const declared = request.headers.get('content-length');
    if (declared !== null && Number(declared) > MAX_WEBHOOK_BYTES) return reject(413, 'payload_too_large', 'too_large');

    let raw: string;
    try {
      raw = await readBodyCapped(request, MAX_WEBHOOK_BYTES);
    } catch (err) {
      if (err instanceof TooLargeError) return reject(413, 'payload_too_large', 'too_large');
      return reject(400, 'bad_request', 'unreadable_body');
    }

    let event;
    try {
      event = await provider.webhook.verify(raw, request.headers, env);
    } catch (err) {
      if (err instanceof IntegrationError && err.kind === 'parse') return reject(400, 'bad_request', 'parse');
      const reason = err instanceof IntegrationError ? err.kind : 'verify_error';
      // Same generic body for a bad signature, a missing header and a stale timestamp.
      return reject(401, 'unauthorized', reason);
    }

    let store: WebhookEventStore;
    let isNew: boolean;
    try {
      store = (deps.store ?? getWebhookEventStore)();
      isNew = await store.claim(provider.name, event.id);
    } catch (err) {
      if (err instanceof IntegrationError && err.kind === 'store_unavailable') {
        // No shared dedupe store: refuse so the provider retries later instead of risking double processing.
        log.error('webhook.store_unavailable', { provider: provider.name, requestId: ctx.requestId });
        return jsonError(503, 'service_unavailable');
      }
      log.error('webhook.store_error', { provider: provider.name, requestId: ctx.requestId, error: err });
      return jsonError(500, 'server_error');
    }
    if (!isNew) return jsonOk({ duplicate: true });

    try {
      await provider.webhook.handle?.(event, env);
      await store.markProcessed(provider.name, event.id);
    } catch (err) {
      await store.release(provider.name, event.id).catch(() => undefined);
      log.error('webhook.handler_failed', { provider: provider.name, eventId: event.id, requestId: ctx.requestId, error: err });
      return jsonError(500, 'server_error');
    }
    return jsonOk({ ok: true });
  };
}
