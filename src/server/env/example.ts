import 'server-only';
import type { ProviderEnv } from './schema';
import { isProductionEnv, isTrue, opt, optFlag, optSecret } from './fields';

export const exampleShape = {
  INTEGRATION_EXAMPLE_ENABLED: optFlag,
  INTEGRATION_EXAMPLE_API_KEY: opt,
  INTEGRATION_EXAMPLE_API_KEY_NEXT: opt,
  INTEGRATION_EXAMPLE_WEBHOOK_SECRET: optSecret,
  INTEGRATION_EXAMPLE_WEBHOOK_SECRET_NEXT: optSecret,
  INTEGRATION_EXAMPLE_BASE_URL: opt,
};

type Vars = Partial<Record<keyof typeof exampleShape | 'VERCEL_ENV' | 'NODE_ENV', string>>;

/** Example (stub) provider: key and secret required when enabled, base URL https and on the allowlist, never in production. */
export function parseExampleEnv(v: Vars, hosts: readonly string[], errors: string[]): ProviderEnv {
  const enabled = isTrue(v.INTEGRATION_EXAMPLE_ENABLED);
  const baseUrl = v.INTEGRATION_EXAMPLE_BASE_URL ?? `https://${hosts[0]}`;
  if (enabled) {
    if (isProductionEnv(v)) errors.push('INTEGRATION_EXAMPLE_ENABLED: the example provider cannot be enabled in production');
    if (!v.INTEGRATION_EXAMPLE_API_KEY) errors.push('INTEGRATION_EXAMPLE_API_KEY: required when INTEGRATION_EXAMPLE_ENABLED is true');
    if (!v.INTEGRATION_EXAMPLE_WEBHOOK_SECRET) {
      errors.push('INTEGRATION_EXAMPLE_WEBHOOK_SECRET: required when INTEGRATION_EXAMPLE_ENABLED is true');
    }
    try {
      const u = new URL(baseUrl);
      if (u.protocol !== 'https:') errors.push('INTEGRATION_EXAMPLE_BASE_URL: must use https');
      else if (!hosts.includes(u.host)) errors.push('INTEGRATION_EXAMPLE_BASE_URL: host is not on the provider allowlist');
      else if (u.username || u.password) errors.push('INTEGRATION_EXAMPLE_BASE_URL: must not contain credentials');
    } catch {
      errors.push('INTEGRATION_EXAMPLE_BASE_URL: must be a valid URL');
    }
  }
  return {
    enabled,
    apiKey: v.INTEGRATION_EXAMPLE_API_KEY,
    apiKeyNext: v.INTEGRATION_EXAMPLE_API_KEY_NEXT,
    webhookSecret: v.INTEGRATION_EXAMPLE_WEBHOOK_SECRET,
    webhookSecretNext: v.INTEGRATION_EXAMPLE_WEBHOOK_SECRET_NEXT,
    baseUrl,
  };
}
