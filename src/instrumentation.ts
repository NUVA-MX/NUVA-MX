import type { Instrumentation } from 'next';

/**
 * Runs once per server boot. Validating the environment here makes an invalid configuration
 * crash at startup with a clear message (variable names only) instead of failing on first use.
 */
export async function register() {
  const { getEnv, nextRuntime } = await import('@/server/env');
  getEnv();
  const runtime = nextRuntime();
  if (runtime === 'nodejs' || runtime === 'edge') {
    const { initSentry } = await import('@/server/observability/sentry');
    await initSentry();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  const { captureRequestError } = await import('@/server/observability/sentry');
  await captureRequestError(...args);
};
