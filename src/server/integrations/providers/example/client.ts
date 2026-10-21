import 'server-only';
import type { Env } from '@/server/env';
import { IntegrationError } from '../../core/errors';
import type { HttpClient } from '../../core/types';
import { EXAMPLE_ALLOWED_HOSTS } from './constants';
import { pingInputSchema, pingResultSchema, type PingInput, type PingResult } from './schemas';

export type ExampleClient = {
  /** POST /v1/ping. Pass an idempotencyKey to make the call safely retryable. */
  createPing(input: PingInput, opts?: { idempotencyKey?: string }): Promise<PingResult>;
};

export function createExampleClient(deps: { http: HttpClient; env: Env }): ExampleClient {
  const cfg = deps.env.integrations.example;
  return {
    async createPing(input, opts = {}) {
      if (!cfg.enabled || !cfg.apiKey) {
        throw new IntegrationError('config', 'example provider is not configured', { provider: 'example' });
      }
      const parsed = pingInputSchema.safeParse(input);
      if (!parsed.success) throw new IntegrationError('parse', 'invalid ping input', { provider: 'example' });
      return deps.http.request({
        provider: { name: 'example', allowedHosts: EXAMPLE_ALLOWED_HOSTS },
        method: 'POST',
        url: new URL('/v1/ping', cfg.baseUrl).href,
        headers: { authorization: `Bearer ${cfg.apiKey}` },
        body: parsed.data,
        schema: pingResultSchema,
        idempotencyKey: opts.idempotencyKey,
      });
    },
  };
}
