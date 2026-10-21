import 'server-only';
import secretNames from './secrets.json';
import { parseEnv, type Env, type EnvSource } from './schema';

export type { Env, ProviderEnv, ProviderName } from './schema';
export { PROVIDER_HOSTS, parseEnv } from './schema';

export class EnvError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
    this.name = 'EnvError';
  }
}

let cached: Env | undefined;

/** Validated, memoized environment. Throws EnvError (variable names only) when invalid. */
export function getEnv(): Env {
  if (cached) return cached;
  const result = parseEnv(process.env as EnvSource);
  if (!result.ok) throw new EnvError(result.errors);
  cached = result.env;
  return cached;
}

/** Test helper: drop the memoized env. */
export function resetEnvCache(): void {
  cached = undefined;
}

/** Like getEnv() but never throws; used by logging so a bad env cannot break error reporting. */
export function getEnvSafe(): Env | null {
  try {
    return getEnv();
  } catch {
    return null;
  }
}

/** True when client-IP headers come from a trusted proxy (Vercel, or TRUST_PROXY_HEADERS=true). */
export function isTrustedProxy(): boolean {
  return getEnvSafe()?.trustProxyHeaders ?? false;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** True when DATABASE_URL is set (the value is never exposed). */
export function isDbConfigured(): boolean {
  return Boolean(getEnv().databaseUrl);
}

export function databaseUrl(): string | undefined {
  return getEnv().databaseUrl;
}

export function blobToken(): string | undefined {
  return getEnv().blobToken;
}

export function isBlobConfigured(): boolean {
  return Boolean(getEnv().blobToken);
}

/** Raw ADMIN_EMAILS (comma separated), parsed by src/lib/auth/emails. */
export function adminEmailsRaw(): string | undefined {
  return getEnv().adminEmails;
}

export function sampleDataMode(): Env['sampleData'] {
  return getEnv().sampleData;
}

export function siteUrl(): string | undefined {
  return getEnv().siteUrl;
}

/** Runtime name set by Next ('nodejs' | 'edge'), used by instrumentation. */
export function nextRuntime(): string | undefined {
  return process.env.NEXT_RUNTIME;
}

export function secretEnvNames(): readonly string[] {
  return secretNames;
}

/** Live values of secret variables (length >= 8), for redaction. Never throws. */
export function liveSecretValues(): string[] {
  const out: string[] = [];
  for (const name of secretNames) {
    const value = process.env[name]?.trim();
    if (value && value.length >= 8) out.push(value);
  }
  return out;
}
