import 'server-only';
import { z } from 'zod';
import { exampleShape, parseExampleEnv } from './example';
import { opt, optSecret } from './fields';
import { innovationShape, parseInnovationEnv, type InnovationEnv } from './innovation';

/** Exact hostnames each provider may talk to. Adding a provider means adding its entry here. */
export const PROVIDER_HOSTS = {
  example: ['api.example.test'],
  innovation: [
    '4vumtdis3m.execute-api.us-east-1.amazonaws.com',
    '1x4nyx8c80.execute-api.us-east-1.amazonaws.com',
    '9w2n2yr7u1.execute-api.us-east-1.amazonaws.com',
  ],
} as const satisfies Record<string, readonly string[]>;

export type ProviderName = keyof typeof PROVIDER_HOSTS;

export type ProviderEnv = {
  enabled: boolean;
  apiKey?: string;
  apiKeyNext?: string;
  webhookSecret?: string;
  webhookSecretNext?: string;
  baseUrl: string;
};

export type Env = {
  nodeEnv: 'development' | 'production' | 'test';
  /** VERCEL_ENV: production | preview | development (undefined outside Vercel). */
  vercelEnv?: string;
  databaseUrl?: string;
  blobToken?: string;
  adminEmails?: string;
  sampleData?: 'sample' | 'empty' | 'error';
  siteUrl?: string;
  upstash?: { url: string; token: string };
  sentryDsn?: string;
  sentryEnvironment?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Trust x-real-ip / x-forwarded-for (true on Vercel or with TRUST_PROXY_HEADERS=true). */
  trustProxyHeaders: boolean;
  auditIpSalt?: string;
  /** Bearer secret for the cron route (Vercel sends it automatically as Authorization). */
  cronSecret?: string;
  integrations: { example: ProviderEnv; innovation: InnovationEnv };
};

export type EnvSource = Record<string, string | undefined>;
export type ParseEnvResult = { ok: true; env: Env } | { ok: false; errors: string[] };

const PUBLIC_ALLOWED = 'NEXT_PUBLIC_SITE_URL';

/** Platform/library-injected names that are not app configuration (Vercel system vars, Next, @vercel/blob). */
export function isPlatformPublicVar(key: string): boolean {
  return key === 'NEXT_PUBLIC_DEBUG' || key.startsWith('NEXT_PUBLIC_VERCEL_');
}

function isUrlWithProtocol(value: string, protocols: string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const shape = z.object({
  NODE_ENV: opt,
  VERCEL_ENV: opt,
  VERCEL: opt,
  TRUST_PROXY_HEADERS: opt,
  DATABASE_URL: opt.refine((v) => v === undefined || isUrlWithProtocol(v, ['postgres:', 'postgresql:']), {
    message: 'must be a postgres:// or postgresql:// URL',
  }),
  BLOB_READ_WRITE_TOKEN: opt,
  ADMIN_EMAILS: opt,
  NUVA_SAMPLE_DATA: opt,
  NEXT_PUBLIC_SITE_URL: opt.refine((v) => v === undefined || isUrlWithProtocol(v, ['http:', 'https:']), {
    message: 'must be an http(s) URL',
  }),
  UPSTASH_REDIS_REST_URL: opt,
  UPSTASH_REDIS_REST_TOKEN: opt,
  KV_REST_API_URL: opt,
  KV_REST_API_TOKEN: opt,
  SENTRY_DSN: opt.refine((v) => v === undefined || isUrlWithProtocol(v, ['http:', 'https:']), {
    message: 'must be a URL',
  }),
  SENTRY_ENVIRONMENT: opt,
  LOG_LEVEL: opt.refine((v) => v === undefined || ['debug', 'info', 'warn', 'error'].includes(v), {
    message: 'must be one of debug, info, warn, error',
  }),
  AUDIT_IP_SALT: optSecret,
  ...exampleShape,
  ...innovationShape,
});

/**
 * Validates a process.env-like object. Error messages name variables, never values.
 * Pure: takes the source as an argument so it can be unit tested.
 */
export function parseEnv(source: EnvSource): ParseEnvResult {
  const errors: string[] = [];

  for (const key of Object.keys(source)) {
    if (key.startsWith('NEXT_PUBLIC_') && key !== PUBLIC_ALLOWED && !isPlatformPublicVar(key)) {
      errors.push(`${key}: NEXT_PUBLIC_* variables are forbidden (only ${PUBLIC_ALLOWED} is allowed)`);
    }
  }

  const picked: Record<string, string | undefined> = {};
  for (const key of Object.keys(shape.shape)) picked[key] = source[key];
  const parsed = shape.safeParse(picked);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${String(issue.path[0] ?? 'env')}: ${issue.message}`);
    }
  }
  if (!parsed.success || errors.length > 0) return { ok: false, errors: dedupe(errors) };

  const v = parsed.data;

  // Upstash: either variable pair (native or Vercel Marketplace KV), both or neither.
  const pairs: Array<[string, string | undefined, string, string | undefined]> = [
    ['UPSTASH_REDIS_REST_URL', v.UPSTASH_REDIS_REST_URL, 'UPSTASH_REDIS_REST_TOKEN', v.UPSTASH_REDIS_REST_TOKEN],
    ['KV_REST_API_URL', v.KV_REST_API_URL, 'KV_REST_API_TOKEN', v.KV_REST_API_TOKEN],
  ];
  let upstash: Env['upstash'];
  for (const [urlName, url, tokenName, token] of pairs) {
    if (Boolean(url) !== Boolean(token)) {
      errors.push(`${url ? tokenName : urlName}: required when ${url ? urlName : tokenName} is set (set both or neither)`);
    } else if (url && token) {
      if (!isUrlWithProtocol(url, ['https:'])) errors.push(`${urlName}: must be an https URL`);
      else upstash ??= { url, token };
    }
  }

  const example = parseExampleEnv(v, PROVIDER_HOSTS.example, errors);
  const { innovation, cronSecret } = parseInnovationEnv(v, errors);

  if (errors.length > 0) return { ok: false, errors: dedupe(errors) };

  const sampleRaw = v.NUVA_SAMPLE_DATA?.toLowerCase();
  const nodeEnv = v.NODE_ENV === 'production' || v.NODE_ENV === 'test' ? v.NODE_ENV : 'development';

  return {
    ok: true,
    env: {
      nodeEnv,
      vercelEnv: v.VERCEL_ENV,
      databaseUrl: v.DATABASE_URL,
      blobToken: v.BLOB_READ_WRITE_TOKEN,
      adminEmails: v.ADMIN_EMAILS,
      // Unknown values are ignored, as before.
      sampleData: sampleRaw === 'sample' || sampleRaw === 'empty' || sampleRaw === 'error' ? sampleRaw : undefined,
      siteUrl: v.NEXT_PUBLIC_SITE_URL,
      upstash,
      sentryDsn: v.SENTRY_DSN,
      sentryEnvironment: v.SENTRY_ENVIRONMENT,
      trustProxyHeaders: Boolean(v.VERCEL) || ['true', '1'].includes((v.TRUST_PROXY_HEADERS ?? '').toLowerCase()),
      logLevel: (v.LOG_LEVEL as Env['logLevel'] | undefined) ?? 'info',
      auditIpSalt: v.AUDIT_IP_SALT,
      cronSecret,
      integrations: { example, innovation },
    },
  };
}

function dedupe(list: string[]): string[] {
  return [...new Set(list)];
}

/**
 * Extra rules for a Vercel deployment, checked at build time (scripts/check-env.ts) on top of parseEnv.
 * Errors fail the deploy; warnings are printed. Names only, never values.
 */
export function deployRequirements(env: Env): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (env.vercelEnv !== 'production' && env.vercelEnv !== 'preview') return { errors, warnings };
  const strict = env.vercelEnv === 'production';
  const need = (ok: boolean, message: string) => {
    if (!ok) (strict ? errors : warnings).push(message);
  };
  need(Boolean(env.databaseUrl), 'DATABASE_URL: required (audit, idempotency and webhook dedupe need a shared store)');
  need(Boolean(env.auditIpSalt), 'AUDIT_IP_SALT: required (otherwise IP/email hashes use a public fallback salt)');
  need(Boolean(env.blobToken), 'BLOB_READ_WRITE_TOKEN: required (without it the app would trust images from any Vercel Blob store)');
  if (!env.upstash) warnings.push('UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN): not set; rate limits are per instance');
  if (!env.sentryDsn) warnings.push('SENTRY_DSN: not set; server errors are not reported');
  return { errors, warnings };
}
