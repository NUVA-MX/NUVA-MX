CREATE TABLE "supplier_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'innovation' NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"subcategory" text,
	"image" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cost_cents" integer,
	"total_stock" integer,
	"search_text" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_products_provider_code_unique" UNIQUE("provider","code"),
	CONSTRAINT "supplier_products_provider" CHECK ("supplier_products"."provider" in ('innovation')),
	CONSTRAINT "supplier_products_code_format" CHECK ("supplier_products"."code" ~ '^[A-Z0-9][A-Z0-9-]{0,29}$'),
	CONSTRAINT "supplier_products_name_len" CHECK (char_length("supplier_products"."name") between 1 and 200),
	CONSTRAINT "supplier_products_description_len" CHECK ("supplier_products"."description" is null or char_length("supplier_products"."description") <= 2000),
	CONSTRAINT "supplier_products_category_len" CHECK ("supplier_products"."category" is null or char_length("supplier_products"."category") <= 80),
	CONSTRAINT "supplier_products_subcategory_len" CHECK ("supplier_products"."subcategory" is null or char_length("supplier_products"."subcategory") <= 80),
	CONSTRAINT "supplier_products_image_len" CHECK ("supplier_products"."image" is null or char_length("supplier_products"."image") <= 2048),
	CONSTRAINT "supplier_products_cost_nonneg" CHECK ("supplier_products"."cost_cents" is null or "supplier_products"."cost_cents" >= 0),
	CONSTRAINT "supplier_products_stock_nonneg" CHECK ("supplier_products"."total_stock" is null or "supplier_products"."total_stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "supplier_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'innovation' NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"trigger" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"accepted" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"deactivated" integer DEFAULT 0 NOT NULL,
	"error_kind" text,
	CONSTRAINT "supplier_sync_runs_provider" CHECK ("supplier_sync_runs"."provider" in ('innovation')),
	CONSTRAINT "supplier_sync_runs_status" CHECK ("supplier_sync_runs"."status" in ('running', 'success', 'failed')),
	CONSTRAINT "supplier_sync_runs_trigger" CHECK ("supplier_sync_runs"."trigger" in ('cron', 'admin'))
);
--> statement-breakpoint
CREATE INDEX "supplier_products_active_category_idx" ON "supplier_products" USING btree ("active","category","name");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_sync_runs_one_running_idx" ON "supplier_sync_runs" USING btree ("provider") WHERE "supplier_sync_runs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "supplier_sync_runs_started_idx" ON "supplier_sync_runs" USING btree ("provider","started_at");