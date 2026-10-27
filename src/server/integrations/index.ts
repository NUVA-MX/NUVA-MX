import 'server-only';
// Public surface of the integrations layer: the only import path for app code (routes, actions, pages).
import { getEnv } from '@/server/env';
import { getHttpClient } from './core/http-client';
import { createRegistry } from './core/registry';
import { createInboundHandler } from './inbound';
import { providers } from './providers';

export { IntegrationError, type IntegrationErrorKind } from './core/errors';
export { createHttpClient, getHttpClient } from './core/http-client';
export { withIdempotency, createWithIdempotency, MemoryIdempotencyStore, type IdempotencyStore } from './core/idempotency';
export { verifyHmacSignature, computeSignature, MemoryWebhookEventStore, setWebhookEventStoreForTests, type WebhookEventStore } from './core/webhooks';
export type { CallOptions, HttpClient, IntegrationResult, ProviderDefinition, VerifiedEvent } from './core/types';
export { createInboundHandler, MAX_WEBHOOK_BYTES } from './inbound';
export { createExampleClient, type ExampleClient } from './providers/example/client';
export { createInnovationClient } from './providers/innovation/client';
export type {
  InnovationClient,
  InnovationColors,
  InnovationProductsPage,
  InnovationStockList,
} from './providers/innovation/client';
export type { InnovationProduct, InnovationStockProduct } from './providers/innovation/schemas';

export const registry = createRegistry(providers);

/** Enabled, fully configured provider definition or null. */
export function getProvider(name: string) {
  return registry.getProvider(name, getEnv());
}

/** Typed client for an enabled provider, or null. Server-side callers only (there is no public outbound route). */
export function getIntegrationClient<C>(name: string): C | null {
  return registry.getClient<C>(name, { http: getHttpClient(), env: getEnv() });
}

export const handleInboundWebhook = createInboundHandler({ registry });
