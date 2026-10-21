import { describe, expect, it } from 'vitest';
import { deployRequirements, parseEnv, type EnvSource } from '../schema';

const SECRET32 = 'a'.repeat(32);

function errors(source: EnvSource): string[] {
  const r = parseEnv(source);
  if (r.ok) throw new Error('expected failure');
  return r.errors;
}

const enabled: EnvSource = {
  INTEGRATION_EXAMPLE_ENABLED: 'true',
  INTEGRATION_EXAMPLE_API_KEY: 'key-value-1234',
  INTEGRATION_EXAMPLE_WEBHOOK_SECRET: SECRET32,
};

describe('parseEnv', () => {
  it('accepts an empty environment with defaults', () => {
    const r = parseEnv({});
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.env.logLevel).toBe('info');
      expect(r.env.integrations.example.enabled).toBe(false);
      expect(r.env.upstash).toBeUndefined();
    }
  });

  it('treats blank values as unset (.env.example style)', () => {
    const r = parseEnv({ DATABASE_URL: '', UPSTASH_REDIS_REST_URL: '  ', NEXT_PUBLIC_SITE_URL: '' });
    expect(r.ok).toBe(true);
  });

  it('rejects a malformed DATABASE_URL without echoing it', () => {
    const e = errors({ DATABASE_URL: 'not a url secret-ish-value' });
    expect(e.join('\n')).toContain('DATABASE_URL');
    expect(e.join('\n')).not.toContain('secret-ish-value');
    expect(errors({ DATABASE_URL: 'mysql://u:p@h/db' }).join()).toContain('DATABASE_URL');
  });

  it('accepts postgres URLs', () => {
    expect(parseEnv({ DATABASE_URL: 'postgresql://u:p@h.neon.tech/db?sslmode=require' }).ok).toBe(true);
  });

  it('rejects a lone Upstash variable (both pairs)', () => {
    expect(errors({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io' }).join()).toContain('UPSTASH_REDIS_REST_TOKEN');
    expect(errors({ UPSTASH_REDIS_REST_TOKEN: 'tok-tok-tok' }).join()).toContain('UPSTASH_REDIS_REST_URL');
    expect(errors({ KV_REST_API_URL: 'https://x.upstash.io' }).join()).toContain('KV_REST_API_TOKEN');
  });

  it('accepts Upstash and Marketplace KV pairs', () => {
    const a = parseEnv({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'tok-tok-tok' });
    expect(a.ok && a.env.upstash?.url).toBe('https://x.upstash.io');
    const b = parseEnv({ KV_REST_API_URL: 'https://y.upstash.io', KV_REST_API_TOKEN: 'tok-tok-tok' });
    expect(b.ok && b.env.upstash?.url).toBe('https://y.upstash.io');
  });

  it('rejects an enabled provider without key or secret', () => {
    const e = errors({ INTEGRATION_EXAMPLE_ENABLED: 'true' }).join('\n');
    expect(e).toContain('INTEGRATION_EXAMPLE_API_KEY');
    expect(e).toContain('INTEGRATION_EXAMPLE_WEBHOOK_SECRET');
  });

  it('rejects a short webhook secret without echoing it', () => {
    const e = errors({ ...enabled, INTEGRATION_EXAMPLE_WEBHOOK_SECRET: 'short-secret' }).join('\n');
    expect(e).toContain('INTEGRATION_EXAMPLE_WEBHOOK_SECRET');
    expect(e).not.toContain('short-secret');
  });

  it('accepts a fully configured provider', () => {
    const r = parseEnv(enabled);
    expect(r.ok && r.env.integrations.example.baseUrl).toBe('https://api.example.test');
  });

  it('rejects non-https and non-allowlisted base URLs', () => {
    expect(errors({ ...enabled, INTEGRATION_EXAMPLE_BASE_URL: 'http://api.example.test' }).join()).toContain('https');
    expect(errors({ ...enabled, INTEGRATION_EXAMPLE_BASE_URL: 'https://evil.test' }).join()).toContain('allowlist');
    expect(errors({ ...enabled, INTEGRATION_EXAMPLE_BASE_URL: 'https://api.example.test.evil.com' }).join()).toContain('allowlist');
    expect(errors({ ...enabled, INTEGRATION_EXAMPLE_BASE_URL: 'https://api.example.test:8443' }).join()).toContain('allowlist');
  });

  it('forbids enabling the example provider in production', () => {
    expect(errors({ ...enabled, VERCEL_ENV: 'production' }).join()).toContain('cannot be enabled in production');
    expect(parseEnv({ ...enabled, VERCEL_ENV: 'preview' }).ok).toBe(true);
  });

  it('allows platform-injected NEXT_PUBLIC_VERCEL_* and NEXT_PUBLIC_DEBUG', () => {
    expect(parseEnv({ NEXT_PUBLIC_VERCEL_ENV: 'production', NEXT_PUBLIC_VERCEL_URL: 'x.vercel.app', NEXT_PUBLIC_DEBUG: '1', NEXT_PUBLIC_VERCEL_BLOB_API_URL: 'x' }).ok).toBe(true);
  });

  it('forbids the example provider with NODE_ENV=production off Vercel', () => {
    expect(errors({ ...enabled, NODE_ENV: 'production' }).join()).toContain('cannot be enabled in production');
    expect(parseEnv({ ...enabled, NODE_ENV: 'production', VERCEL_ENV: 'preview' }).ok).toBe(true);
  });

  it('trusts proxy headers on Vercel or with TRUST_PROXY_HEADERS', () => {
    const a = parseEnv({ VERCEL: '1' });
    expect(a.ok && a.env.trustProxyHeaders).toBe(true);
    const b = parseEnv({ TRUST_PROXY_HEADERS: 'true' });
    expect(b.ok && b.env.trustProxyHeaders).toBe(true);
    const c = parseEnv({});
    expect(c.ok && c.env.trustProxyHeaders).toBe(false);
  });

  it('rejects any NEXT_PUBLIC_* other than NEXT_PUBLIC_SITE_URL', () => {
    expect(errors({ NEXT_PUBLIC_API_KEY: 'abc' }).join()).toContain('NEXT_PUBLIC_API_KEY');
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: 'https://nuva.mx' }).ok).toBe(true);
  });

  it('validates NEXT_PUBLIC_SITE_URL, LOG_LEVEL, AUDIT_IP_SALT, SENTRY_DSN', () => {
    expect(errors({ NEXT_PUBLIC_SITE_URL: 'nuva' }).join()).toContain('NEXT_PUBLIC_SITE_URL');
    expect(errors({ LOG_LEVEL: 'loud' }).join()).toContain('LOG_LEVEL');
    expect(errors({ AUDIT_IP_SALT: 'short' }).join()).toContain('AUDIT_IP_SALT');
    expect(errors({ SENTRY_DSN: 'nope' }).join()).toContain('SENTRY_DSN');
    expect(parseEnv({ AUDIT_IP_SALT: SECRET32, LOG_LEVEL: 'debug' }).ok).toBe(true);
  });

  it('normalizes NUVA_SAMPLE_DATA and ignores unknown values', () => {
    const a = parseEnv({ NUVA_SAMPLE_DATA: ' Empty ' });
    expect(a.ok && a.env.sampleData).toBe('empty');
    const b = parseEnv({ NUVA_SAMPLE_DATA: 'whatever' });
    expect(b.ok && b.env.sampleData).toBeUndefined();
  });
});

describe('deployRequirements (build-time check)', () => {
  const env = (src: Record<string, string>) => {
    const r = parseEnv(src);
    if (!r.ok) throw new Error(r.errors.join());
    return r.env;
  };
  const salt = 's'.repeat(40);

  it('fails a Vercel production build without DATABASE_URL or AUDIT_IP_SALT', () => {
    const { errors } = deployRequirements(env({ VERCEL_ENV: 'production' }));
    expect(errors.map((e) => e.split(':')[0])).toEqual(['DATABASE_URL', 'AUDIT_IP_SALT', 'BLOB_READ_WRITE_TOKEN']);
  });

  it('passes production when all are set, warning about Upstash and Sentry', () => {
    const r = deployRequirements(env({ VERCEL_ENV: 'production', DATABASE_URL: 'postgres://u:p@h/db', AUDIT_IP_SALT: salt, BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_abc123_secret' }));
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(2);
  });

  it('only warns on preview and does nothing locally', () => {
    expect(deployRequirements(env({ VERCEL_ENV: 'preview' })).errors).toEqual([]);
    expect(deployRequirements(env({ VERCEL_ENV: 'preview' })).warnings.length).toBeGreaterThan(0);
    expect(deployRequirements(env({}))).toEqual({ errors: [], warnings: [] });
  });

  it('never prints values', () => {
    const r = deployRequirements(env({ VERCEL_ENV: 'production', DATABASE_URL: 'postgres://u:hunter2secret@h/db' }));
    expect(JSON.stringify(r)).not.toContain('hunter2secret');
  });
});
