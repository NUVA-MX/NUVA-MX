import 'server-only';
import { log } from '@/server/log/logger';
import type { ProviderDefinition } from '../../core/types';
import { createExampleClient, type ExampleClient } from './client';
import { EXAMPLE_ALLOWED_HOSTS } from './constants';
import { verifyExampleWebhook } from './webhook';

export const exampleProvider: ProviderDefinition<ExampleClient> = {
  name: 'example',
  allowedHosts: EXAMPLE_ALLOWED_HOSTS,
  isEnabled(env) {
    const c = env.integrations.example;
    return c.enabled && Boolean(c.apiKey) && Boolean(c.webhookSecret) && Boolean(c.baseUrl);
  },
  createClient: createExampleClient,
  webhook: {
    verify: (raw, headers, env) => verifyExampleWebhook(raw, headers, env),
    async handle(event) {
      // Stub: a real provider would update orders, stock, etc. Only non-sensitive fields are logged.
      log.info('webhook.example.received', { eventId: event.id, type: event.type });
    },
  },
};
