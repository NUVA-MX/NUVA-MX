import 'server-only';

export type IntegrationErrorKind =
  | 'config'
  | 'allowlist'
  | 'timeout'
  | 'http'
  | 'parse'
  | 'too_large'
  | 'circuit_open'
  | 'signature'
  | 'replay'
  | 'idempotency_mismatch'
  | 'idempotency_in_progress'
  | 'store_unavailable';

/** Every failure of the integrations layer. Messages never contain secrets, headers or bodies. */
export class IntegrationError extends Error {
  readonly kind: IntegrationErrorKind;
  readonly provider?: string;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(
    kind: IntegrationErrorKind,
    message: string,
    opts: { provider?: string; status?: number; retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = 'IntegrationError';
    this.kind = kind;
    this.provider = opts.provider;
    this.status = opts.status;
    this.retryAfterMs = opts.retryAfterMs;
  }
}
