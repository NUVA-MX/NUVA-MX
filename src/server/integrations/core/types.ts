import 'server-only';
import type { ZodType } from 'zod';
import type { Env } from '@/server/env';
import type { IntegrationError } from './errors';

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** What the http-client needs to know about a provider. */
export type ProviderRef = { name: string; allowedHosts: readonly string[] };

export type CallOptions<T> = {
  provider: ProviderRef;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  /** Objects are sent as JSON; strings as-is. */
  body?: unknown;
  schema: ZodType<T>;
  /** Default 8000, max 30000. */
  timeoutMs?: number;
  /** Default 2, max 5. */
  retries?: number;
  /** Enables retries for non-idempotent methods and is sent as the Idempotency-Key header. */
  idempotencyKey?: string;
  /** Default 1 MB. */
  maxResponseBytes?: number;
};

export interface HttpClient {
  request<T>(options: CallOptions<T>): Promise<T>;
}

export type VerifiedEvent = {
  id: string;
  type: string;
  payload: unknown;
};

export interface ProviderDefinition<C = unknown> {
  name: string;
  /** Exact hostnames (optionally host:port) the provider may be called on. */
  allowedHosts: readonly string[];
  /** True only when the provider is enabled AND fully configured. */
  isEnabled(env: Env): boolean;
  createClient(deps: { http: HttpClient; env: Env }): C;
  webhook?: {
    /** Throws IntegrationError('signature' | 'replay' | 'parse') when the event is not trustworthy. */
    verify(raw: string, headers: Headers, env: Env): Promise<VerifiedEvent>;
    /** Called after verification and dedupe. Must be quick. */
    handle?(event: VerifiedEvent, env: Env): Promise<void>;
  };
}

export type IntegrationResult<T> = { ok: true; value: T } | { ok: false; error: IntegrationError };
