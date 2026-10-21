import 'server-only';
import { liveSecretValues } from '@/server/env';

export const REDACTED = '[REDACTED]';
const MAX_STRING = 1000;
const MAX_DEPTH = 8;

/** Keys whose values are always masked. */
export const SENSITIVE_KEY = /pass|secret|token|authorization|cookie|api[-_]?key|signature|dsn|session|email|phone|pwd|cred|auth|jwt|(?:^|[-_])key$/i;

/** Patterns masked wherever they appear inside string values. */
const PATTERNS: RegExp[] = [
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+/g,
  /vercel_blob_rw_[A-Za-z0-9_-]+/g,
  /eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g,
  /postgres(?:ql)?:\/\/[^\s'"]*/gi,
  // Any scheme://user:pass@host URL (mongodb+srv, redis, amqp, https with credentials...)
  /[a-z][a-z0-9+.-]*:\/\/[^\s/:@'"]+:[^\s/@'"]+@[^\s'"]*/gi,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g,
];

/** Secret-looking query parameters (?token=..., &sig=..., &access_key=...). */
const QUERY_SECRET = /([?&][^=&\s#]*(?:token|sig|key|secret|pass|pwd|auth|access|credential|code)[^=&\s#]*=)[^&\s#]+/gi;

export type RedactOptions = {
  /** Extra literal secret values to mask (defaults to live values of the vars in secrets.json). */
  secretValues?: string[];
};

export function redactString(input: string, opts: RedactOptions = {}): string {
  let out = input;
  const secrets = opts.secretValues ?? liveSecretValues();
  for (const s of secrets) {
    if (s.length >= 8 && out.includes(s)) out = out.split(s).join(REDACTED);
  }
  for (const re of PATTERNS) out = out.replace(re, REDACTED);
  out = out.replace(QUERY_SECRET, `$1${REDACTED}`);
  if (out.length > MAX_STRING) out = `${out.slice(0, MAX_STRING)}...[truncated ${out.length - MAX_STRING} chars]`;
  return out;
}

/** Deep, cycle-safe redaction by key name, known secret patterns and live secret values. */
export function redact(value: unknown, opts: RedactOptions = {}): unknown {
  const resolved: RedactOptions = { secretValues: opts.secretValues ?? liveSecretValues() };
  return walk(value, resolved, new WeakSet(), 0);
}

function walk(value: unknown, opts: RedactOptions, seen: WeakSet<object>, depth: number): unknown {
  if (value === null || value === undefined) return value;
  switch (typeof value) {
    case 'string':
      return redactString(value, opts);
    case 'number':
    case 'boolean':
      return value;
    case 'bigint':
      return value.toString();
    case 'symbol':
    case 'function':
      return `[${typeof value}]`;
  }
  const obj = value as object;
  if (seen.has(obj)) return '[Circular]';
  if (depth >= MAX_DEPTH) return '[MaxDepth]';
  seen.add(obj);
  try {
    if (obj instanceof Date) return Number.isNaN(obj.getTime()) ? null : obj.toISOString();
    if (obj instanceof Error) {
      const out: Record<string, unknown> = { name: obj.name, message: redactString(obj.message, opts) };
      if (obj.stack) out.stack = redactString(obj.stack, opts);
      if (obj.cause !== undefined) out.cause = walk(obj.cause, opts, seen, depth + 1);
      return out;
    }
    if (Array.isArray(obj)) return obj.map((v) => walk(v, opts, seen, depth + 1));
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = SENSITIVE_KEY.test(k) ? REDACTED : walk(v, opts, seen, depth + 1);
    }
    return out;
  } finally {
    seen.delete(obj);
  }
}
