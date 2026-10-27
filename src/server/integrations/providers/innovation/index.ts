import 'server-only';
import type { ProviderDefinition } from '../../core/types';
import { createInnovationClient, type InnovationClient } from './client';
import { INNOVATION_ALLOWED_HOSTS } from './constants';

/** Supplier catalog provider (read-only pulls, no webhook). */
export const innovationProvider: ProviderDefinition<InnovationClient> = {
  name: 'innovation',
  allowedHosts: INNOVATION_ALLOWED_HOSTS,
  isEnabled(env) {
    const c = env.integrations.innovation;
    return c.enabled && Boolean(c.apiKey) && Boolean(c.user) && Boolean(c.password);
  },
  createClient: createInnovationClient,
};
