// Database schema (Drizzle). No 'server-only' so scripts (tsx) can import it;
// it holds no secrets or connections.
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { PROJECT_LIMITS, PROJECT_TECHNIQUES } from '../content/limits';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    meta: text('meta'),
    /** Pesos MXN enteros. */
    price: integer('price'),
    stock: integer('stock'),
    category: text('category'),
    imageUrl: text('image_url'),
    imageAlt: text('image_alt'),
    visible: boolean('visible').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check('products_price_nonneg', sql`${t.price} >= 0`),
    check('products_stock_nonneg', sql`${t.stock} >= 0`),
    index('products_visible_sort_idx').on(t.visible, t.sortOrder, t.createdAt),
  ],
);

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('admin_users_email_lower', sql`${t.email} = lower(${t.email})`)],
);

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 (hex) of the cookie token; the plain token is never stored. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    actorType: text('actor_type').notNull(),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    target: text('target'),
    outcome: text('outcome').notNull(),
    /** Salted SHA-256 of the client IP. The raw IP is never stored. */
    ipHash: text('ip_hash'),
    requestId: text('request_id'),
    metadata: jsonb('metadata'),
  },
  (t) => [
    check('audit_events_actor_type', sql`${t.actorType} in ('admin', 'system', 'integration', 'webhook')`),
    check('audit_events_outcome', sql`${t.outcome} in ('success', 'failure', 'denied')`),
    index('audit_events_created_idx').on(t.createdAt),
    index('audit_events_action_created_idx').on(t.action, t.createdAt),
  ],
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    scope: text('scope').notNull(),
    key: text('key').notNull(),
    requestHash: text('request_hash').notNull(),
    status: text('status').notNull(),
    response: jsonb('response'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.scope, t.key] }),
    check('idempotency_keys_status', sql`${t.status} in ('in_progress', 'completed', 'failed')`),
  ],
);

export const webhookEvents = pgTable(
  'webhook_events',
  {
    provider: text('provider').notNull(),
    eventId: text('event_id').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status').notNull().default('received'),
  },
  (t) => [
    unique('webhook_events_provider_event_unique').on(t.provider, t.eventId),
    check('webhook_events_status', sql`${t.status} in ('received', 'processed', 'failed')`),
  ],
);

/**
 * Editable overrides for the /encargo page. One row (key = 'encargo'). `data` holds overrides only:
 * { [sectionKey]: { [fieldKey]: value } }. Anything absent falls back to the hard-coded content.
 */
export const siteContent = pgTable(
  'site_content',
  {
    key: text('key').primaryKey(),
    data: jsonb('data').notNull().default({}),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  },
  (t) => [check('site_content_key', sql`${t.key} = 'encargo'`)],
);

const techniqueList = sql.raw(PROJECT_TECHNIQUES.map((t) => `'${t}'`).join(', '));

/** Portfolio projects shown on /encargo. Text limits mirror the zod schema (src/lib/content/limits.ts). */
export const encargoProjects = pgTable(
  'encargo_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    technique: text('technique').notNull(),
    tag: text('tag').notNull(),
    meta: text('meta').notNull(),
    description: text('description').notNull(),
    techniqueDetail: text('technique_detail').notNull(),
    minimum: text('minimum').notNull(),
    colors: text('colors').notNull(),
    delivery: text('delivery').notNull(),
    imageUrl: text('image_url'),
    imageAlt: text('image_alt').notNull().default(''),
    visible: boolean('visible').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check('encargo_projects_technique', sql`${t.technique} in (${techniqueList})`),
    check('encargo_projects_name_len', sql`char_length(${t.name}) between 1 and ${sql.raw(String(PROJECT_LIMITS.name))}`),
    check('encargo_projects_tag_len', sql`char_length(${t.tag}) <= ${sql.raw(String(PROJECT_LIMITS.tag))}`),
    check('encargo_projects_meta_len', sql`char_length(${t.meta}) <= ${sql.raw(String(PROJECT_LIMITS.meta))}`),
    check('encargo_projects_description_len', sql`char_length(${t.description}) <= ${sql.raw(String(PROJECT_LIMITS.description))}`),
    check('encargo_projects_technique_detail_len', sql`char_length(${t.techniqueDetail}) <= ${sql.raw(String(PROJECT_LIMITS.techniqueDetail))}`),
    check('encargo_projects_minimum_len', sql`char_length(${t.minimum}) <= ${sql.raw(String(PROJECT_LIMITS.minimum))}`),
    check('encargo_projects_colors_len', sql`char_length(${t.colors}) <= ${sql.raw(String(PROJECT_LIMITS.colors))}`),
    check('encargo_projects_delivery_len', sql`char_length(${t.delivery}) <= ${sql.raw(String(PROJECT_LIMITS.delivery))}`),
    check('encargo_projects_image_alt_len', sql`char_length(${t.imageAlt}) <= ${sql.raw(String(PROJECT_LIMITS.imageAlt))}`),
    check('encargo_projects_image_url_len', sql`${t.imageUrl} is null or char_length(${t.imageUrl}) <= 2048`),
    index('encargo_projects_visible_sort_idx').on(t.visible, t.sortOrder),
  ],
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type EncargoProjectRow = typeof encargoProjects.$inferSelect;
export type NewEncargoProjectRow = typeof encargoProjects.$inferInsert;
