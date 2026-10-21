import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq, lt, or, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { webhookEvents } from '@/lib/db/schema';
import { isDbConfigured, isProduction } from '@/server/env';
import { IntegrationError } from './errors';

export const DEFAULT_TOLERANCE_SEC = 300;

export function computeSignature(secret: string, timestamp: string, payload: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
}

/** True when a Unix-seconds timestamp is within +/- toleranceSec of now. */
export function isTimestampFresh(timestamp: string, toleranceSec = DEFAULT_TOLERANCE_SEC, nowMs = Date.now()): boolean {
  if (!/^\d{1,12}$/.test(timestamp)) return false;
  return Math.abs(nowMs / 1000 - Number(timestamp)) <= toleranceSec;
}

/**
 * HMAC-SHA256 over `${timestamp}.${payload}`, compared in constant time.
 * Returns false (never throws) on malformed or mismatched signatures and on stale or future timestamps.
 */
export function verifyHmacSignature(input: {
  secret: string;
  payload: string;
  signature: string | null | undefined;
  timestamp: string | null | undefined;
  toleranceSec?: number;
  nowMs?: number;
}): boolean {
  const { secret, payload, signature, timestamp } = input;
  if (!secret || !signature || !timestamp) return false;
  if (!isTimestampFresh(timestamp, input.toleranceSec ?? DEFAULT_TOLERANCE_SEC, input.nowMs)) return false;
  const given = signature.trim().replace(/^(sha256|v1)=/i, '');
  if (!/^[0-9a-fA-F]{64}$/.test(given)) return false;
  const expected = Buffer.from(computeSignature(secret, timestamp, payload), 'hex');
  const actual = Buffer.from(given, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

// ---- Dedupe store ---------------------------------------------------------------------------

/** A claim left in 'received' longer than this (crash or timeout mid-handle) can be claimed again. */
export const STALE_CLAIM_MS = 5 * 60 * 1000;

export interface WebhookEventStore {
  /**
   * True when this (provider, eventId) is new (or its earlier claim is stale/failed) and now claimed;
   * false when it is already processed or being processed.
   */
  claim(provider: string, eventId: string): Promise<boolean>;
  markProcessed(provider: string, eventId: string): Promise<void>;
  /** Forget a claim so the provider's retry can be processed again (used when handling failed). */
  release(provider: string, eventId: string): Promise<void>;
}

const MEMORY_MAX = 10_000;

export class MemoryWebhookEventStore implements WebhookEventStore {
  private seen = new Map<string, { status: 'received' | 'processed'; at: number }>();
  constructor(private readonly now: () => number = Date.now) {}
  async claim(provider: string, eventId: string): Promise<boolean> {
    const id = `${provider}\u0000${eventId}`;
    const existing = this.seen.get(id);
    if (existing && (existing.status === 'processed' || this.now() - existing.at < STALE_CLAIM_MS)) return false;
    if (!existing && this.seen.size >= MEMORY_MAX) this.seen.delete(this.seen.keys().next().value as string);
    this.seen.set(id, { status: 'received', at: this.now() });
    return true;
  }
  async markProcessed(provider: string, eventId: string): Promise<void> {
    const id = `${provider}\u0000${eventId}`;
    if (this.seen.has(id)) this.seen.set(id, { status: 'processed', at: this.now() });
  }
  async release(provider: string, eventId: string): Promise<void> {
    this.seen.delete(`${provider}\u0000${eventId}`);
  }
}

export class DrizzleWebhookEventStore implements WebhookEventStore {
  async claim(provider: string, eventId: string): Promise<boolean> {
    const rows = await getDb()
      .insert(webhookEvents)
      .values({ provider, eventId, status: 'received' })
      .onConflictDoUpdate({
        target: [webhookEvents.provider, webhookEvents.eventId],
        set: { status: 'received', receivedAt: sql`now()` },
        setWhere: or(
          eq(webhookEvents.status, 'failed'),
          and(eq(webhookEvents.status, 'received'), lt(webhookEvents.receivedAt, sql`now() - interval '5 minutes'`)),
        ),
      })
      .returning({ eventId: webhookEvents.eventId });
    return rows.length > 0;
  }
  async markProcessed(provider: string, eventId: string): Promise<void> {
    await getDb()
      .update(webhookEvents)
      .set({ status: 'processed' })
      .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventId, eventId)));
  }
  async release(provider: string, eventId: string): Promise<void> {
    await getDb()
      .delete(webhookEvents)
      .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventId, eventId)));
  }
}

let defaultStore: WebhookEventStore | undefined;

/**
 * Drizzle store when DATABASE_URL is set. Without a database, development uses an in-memory store (per
 * instance); production refuses with IntegrationError('store_unavailable') so events are never deduped
 * per instance only (a provider retry landing on another instance would be processed twice).
 */
export function getWebhookEventStore(): WebhookEventStore {
  if (defaultStore) return defaultStore;
  if (isDbConfigured()) return (defaultStore = new DrizzleWebhookEventStore());
  if (isProduction()) {
    throw new IntegrationError('store_unavailable', 'webhook dedupe requires DATABASE_URL in production');
  }
  return (defaultStore = new MemoryWebhookEventStore());
}

/** Test helper. */
export function setWebhookEventStoreForTests(store: WebhookEventStore | undefined): void {
  defaultStore = store;
}
