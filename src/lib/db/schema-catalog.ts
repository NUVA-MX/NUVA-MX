// Supplier catalog tables (Drizzle). No 'server-only' so drizzle-kit can load it.
import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/** One row per supplier product. `cost_cents` is server-only and must never be selected by public queries. */
export const supplierProducts = pgTable(
  'supplier_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull().default('innovation'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category'),
    subcategory: text('subcategory'),
    image: text('image'),
    /** Array of safe image URLs (max 8). */
    images: jsonb('images').notNull().default([]),
    /** Array of { code, tone, hex, image, stock } (max 40). Stock numbers never leave the server. */
    variants: jsonb('variants').notNull().default([]),
    /** { material, size, weight, printTechnique, printArea, packQty } as text or null. */
    specs: jsonb('specs').notNull().default({}),
    /** Supplier price in cents. Server-only. */
    costCents: integer('cost_cents'),
    totalStock: integer('total_stock'),
    /** Lowercase, accent-free text used by the search. */
    searchText: text('search_text').notNull().default(''),
    active: boolean('active').notNull().default(true),
    /** Sync run that last saw this row; rows from older runs are deactivated after a healthy run. */
    lastRunId: uuid('last_run_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('supplier_products_provider_code_unique').on(t.provider, t.code),
    check('supplier_products_provider', sql`${t.provider} in ('innovation')`),
    check('supplier_products_code_format', sql`${t.code} ~ '^[A-Z0-9][A-Z0-9-]{0,29}$'`),
    check('supplier_products_name_len', sql`char_length(${t.name}) between 1 and 200`),
    check('supplier_products_description_len', sql`${t.description} is null or char_length(${t.description}) <= 2000`),
    check('supplier_products_category_len', sql`${t.category} is null or char_length(${t.category}) <= 80`),
    check('supplier_products_subcategory_len', sql`${t.subcategory} is null or char_length(${t.subcategory}) <= 80`),
    check('supplier_products_image_len', sql`${t.image} is null or char_length(${t.image}) <= 2048`),
    check('supplier_products_cost_nonneg', sql`${t.costCents} is null or ${t.costCents} >= 0`),
    check('supplier_products_stock_nonneg', sql`${t.totalStock} is null or ${t.totalStock} >= 0`),
    index('supplier_products_active_category_idx').on(t.active, t.category, t.name),
  ],
);

/** One row per sync attempt. The partial unique index allows a single `running` row per provider. */
export const supplierSyncRuns = pgTable(
  'supplier_sync_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull().default('innovation'),
    status: text('status').notNull().default('running'),
    trigger: text('trigger').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    accepted: integer('accepted').notNull().default(0),
    rejected: integer('rejected').notNull().default(0),
    deactivated: integer('deactivated').notNull().default(0),
    /** Failure category only (never supplier text or messages). */
    errorKind: text('error_kind'),
  },
  (t) => [
    check('supplier_sync_runs_provider', sql`${t.provider} in ('innovation')`),
    check('supplier_sync_runs_status', sql`${t.status} in ('running', 'success', 'failed')`),
    check('supplier_sync_runs_trigger', sql`${t.trigger} in ('cron', 'admin')`),
    uniqueIndex('supplier_sync_runs_one_running_idx').on(t.provider).where(sql`${t.status} = 'running'`),
    index('supplier_sync_runs_started_idx').on(t.provider, t.startedAt),
  ],
);

export type SupplierProductRow = typeof supplierProducts.$inferSelect;
export type NewSupplierProductRow = typeof supplierProducts.$inferInsert;
export type SupplierSyncRunRow = typeof supplierSyncRuns.$inferSelect;
