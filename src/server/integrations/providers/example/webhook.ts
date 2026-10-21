import 'server-only';
import type { Env } from '@/server/env';
import { IntegrationError } from '../../core/errors';
import type { VerifiedEvent } from '../../core/types';
import { DEFAULT_TOLERANCE_SEC, isTimestampFresh, verifyHmacSignature } from '../../core/webhooks';
import { SIGNATURE_HEADER, TIMESTAMP_HEADER } from './constants';
import { exampleWebhookSchema } from './schemas';

/**
 * Verifies an example-provider webhook: HMAC-SHA256 over `${timestamp}.${rawBody}` using the current
 * secret or, during rotation, the _NEXT secret.
 */
export async function verifyExampleWebhook(raw: string, headers: Headers, env: Env, nowMs = Date.now()): Promise<VerifiedEvent> {
  const cfg = env.integrations.example;
  const signature = headers.get(SIGNATURE_HEADER);
  const timestamp = headers.get(TIMESTAMP_HEADER);
  const secrets = [cfg.webhookSecret, cfg.webhookSecretNext].filter((s): s is string => Boolean(s));

  if (!signature || !timestamp || secrets.length === 0) {
    throw new IntegrationError('signature', 'missing signature headers', { provider: 'example' });
  }
  if (!isTimestampFresh(timestamp, DEFAULT_TOLERANCE_SEC, nowMs)) {
    throw new IntegrationError('replay', 'timestamp outside tolerance', { provider: 'example' });
  }
  const valid = secrets.some((secret) => verifyHmacSignature({ secret, payload: raw, signature, timestamp, nowMs }));
  if (!valid) throw new IntegrationError('signature', 'invalid signature', { provider: 'example' });

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new IntegrationError('parse', 'body is not valid JSON', { provider: 'example' });
  }
  const parsed = exampleWebhookSchema.safeParse(json);
  if (!parsed.success) throw new IntegrationError('parse', 'body does not match the webhook schema', { provider: 'example' });
  return { id: parsed.data.id, type: parsed.data.type, payload: parsed.data.data };
}
