import { describe, expect, it } from 'vitest';
import { parseEnv, type EnvSource } from '../schema';

const CRON = 'c'.repeat(32);
const complete: EnvSource = {
  INTEGRATION_INNOVATION_ENABLED: 'true',
  INTEGRATION_INNOVATION_API_KEY: 'dummy-token-1234',
  INTEGRATION_INNOVATION_USER: 'dummy@example.mx',
  INTEGRATION_INNOVATION_PASSWORD: 'dummy-pass-1',
};

function errors(source: EnvSource): string {
  const r = parseEnv(source);
  if (r.ok) throw new Error('expected failure');
  return r.errors.join('\n');
}

describe('innovation env', () => {
  it('is disabled by default and the public catalog defaults to on', () => {
    const r = parseEnv({});
    expect(r.ok && r.env.integrations.innovation.enabled).toBe(false);
    expect(r.ok && r.env.integrations.innovation.catalogPublic).toBe(true);
  });

  it('names each missing variable when enabled, never a value', () => {
    const e = errors({ INTEGRATION_INNOVATION_ENABLED: 'true' });
    for (const n of ['API_KEY', 'USER', 'PASSWORD']) expect(e).toContain(`INTEGRATION_INNOVATION_${n}: required`);
    const partial = errors({ ...complete, INTEGRATION_INNOVATION_USER: '', INTEGRATION_INNOVATION_API_KEY: 'secret-token-zzz' });
    expect(partial).toContain('INTEGRATION_INNOVATION_USER');
    expect(partial).not.toContain('secret-token-zzz');
  });

  it('accepts a complete configuration', () => {
    const r = parseEnv({ ...complete, VERCEL_ENV: 'preview', CRON_SECRET: CRON });
    expect(r.ok && r.env.integrations.innovation.user).toBe('dummy@example.mx');
    expect(r.ok && r.env.cronSecret).toBe(CRON);
  });

  it('rejects IGNORE_WINDOW in production but allows it elsewhere', () => {
    expect(errors({ INTEGRATION_INNOVATION_IGNORE_WINDOW: 'true', VERCEL_ENV: 'production' })).toContain('INTEGRATION_INNOVATION_IGNORE_WINDOW');
    expect(errors({ INTEGRATION_INNOVATION_IGNORE_WINDOW: 'true', NODE_ENV: 'production' })).toContain('IGNORE_WINDOW');
    const dev = parseEnv({ INTEGRATION_INNOVATION_IGNORE_WINDOW: 'true', VERCEL_ENV: 'preview' });
    expect(dev.ok && dev.env.integrations.innovation.ignoreWindow).toBe(true);
  });

  it('requires a 32+ char CRON_SECRET when enabled in production', () => {
    expect(errors({ ...complete, VERCEL_ENV: 'production' })).toContain('CRON_SECRET: required');
    expect(errors({ ...complete, VERCEL_ENV: 'production', CRON_SECRET: 'too-short-secret' })).toContain('CRON_SECRET: must be at least 32');
    expect(parseEnv({ ...complete, VERCEL_ENV: 'production', CRON_SECRET: CRON }).ok).toBe(true);
  });

  it('forbids NEXT_PUBLIC_ variants of the supplier and cron variables', () => {
    expect(errors({ NEXT_PUBLIC_INTEGRATION_INNOVATION_API_KEY: 'x' })).toContain('NEXT_PUBLIC_*');
    expect(errors({ NEXT_PUBLIC_CRON_SECRET: 'x' })).toContain('NEXT_PUBLIC_*');
  });

  it('CATALOG_PUBLIC=false turns the public catalog off', () => {
    const r = parseEnv({ INTEGRATION_INNOVATION_CATALOG_PUBLIC: 'false' });
    expect(r.ok && r.env.integrations.innovation.catalogPublic).toBe(false);
  });
});
