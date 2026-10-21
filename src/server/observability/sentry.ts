import 'server-only';
import { getEnvSafe } from '@/server/env';
import { redact } from '@/server/log/redact';

let enabled = false;

/** Sentry is entirely optional: without SENTRY_DSN this is a no-op and the SDK is never loaded. */
export async function initSentry(): Promise<boolean> {
  const env = getEnvSafe();
  if (!env?.sentryDsn) return false;
  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.sentryEnvironment ?? env.vercelEnv ?? env.nodeEnv,
    // @sentry/nextjs 11 replaced `sendDefaultPii` with `dataCollection`: collect no PII-bearing data.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    tracesSampleRate: 0,
    beforeSend: (event) => redact(event) as typeof event,
    beforeBreadcrumb: (crumb) => redact(crumb) as typeof crumb,
  });
  enabled = true;
  return true;
}

export function isSentryEnabled(): boolean {
  return enabled;
}

type RequestErrorArgs = Parameters<typeof import('@sentry/nextjs').captureRequestError>;

/** Reports a request error to Sentry when enabled; never throws. */
export async function captureRequestError(...args: RequestErrorArgs): Promise<void> {
  if (!enabled) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureRequestError(...args);
  } catch {
    // reporting must never break the request
  }
}
