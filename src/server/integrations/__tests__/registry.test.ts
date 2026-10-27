import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/server/env';
import { createRegistry } from '../core/registry';
import { providers } from '../providers';

const enabled = parseEnv({
  INTEGRATION_EXAMPLE_ENABLED: 'true',
  INTEGRATION_EXAMPLE_API_KEY: 'key-abcdef-123',
  INTEGRATION_EXAMPLE_WEBHOOK_SECRET: 'z'.repeat(32),
});
const disabled = parseEnv({});

describe('registry', () => {
  const registry = createRegistry(providers);
  it('returns only enabled, fully configured providers', () => {
    if (!enabled.ok || !disabled.ok) throw new Error('env');
    expect(registry.getProvider('example', enabled.env)?.name).toBe('example');
    expect(registry.getProvider('example', disabled.env)).toBeNull();
    expect(registry.getProvider('unknown', enabled.env)).toBeNull();
    // Half-configured (forged env object): still refused.
    const half = { ...enabled.env, integrations: { ...enabled.env.integrations, example: { ...enabled.env.integrations.example, apiKey: undefined } } };
    expect(registry.getProvider('example', half)).toBeNull();
  });
});
