import 'server-only';
import type { Env } from '@/server/env';
import type { HttpClient, ProviderDefinition } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry holds providers with different client types
export type AnyProvider = ProviderDefinition<any>;

/**
 * Registry of providers. Only providers that are enabled AND fully configured are returned,
 * so a half-configured provider can never be reached by routes or callers.
 * The list of providers is supplied by integrations/providers/index.ts (core never names a provider).
 */
export function createRegistry(providers: readonly AnyProvider[]) {
  const byName = new Map(providers.map((p) => [p.name, p]));
  return {
    getProvider(name: string, env: Env): AnyProvider | null {
      const p = byName.get(name);
      return p && p.isEnabled(env) ? p : null;
    },
    getClient<C = unknown>(name: string, deps: { http: HttpClient; env: Env }): C | null {
      const p = this.getProvider(name, deps.env);
      return p ? (p.createClient(deps) as C) : null;
    },
    names(): string[] {
      return [...byName.keys()];
    },
  };
}

export type Registry = ReturnType<typeof createRegistry>;
