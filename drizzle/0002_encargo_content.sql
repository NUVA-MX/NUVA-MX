CREATE TABLE "encargo_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"technique" text NOT NULL,
	"tag" text NOT NULL,
	"meta" text NOT NULL,
	"description" text NOT NULL,
	"technique_detail" text NOT NULL,
	"minimum" text NOT NULL,
	"colors" text NOT NULL,
	"delivery" text NOT NULL,
	"image_url" text,
	"image_alt" text DEFAULT '' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encargo_projects_technique" CHECK ("encargo_projects"."technique" in ('Bordado', 'Estampado', 'Serigrafía', 'Accesorios')),
	CONSTRAINT "encargo_projects_name_len" CHECK (char_length("encargo_projects"."name") between 1 and 60),
	CONSTRAINT "encargo_projects_tag_len" CHECK (char_length("encargo_projects"."tag") <= 30),
	CONSTRAINT "encargo_projects_meta_len" CHECK (char_length("encargo_projects"."meta") <= 80),
	CONSTRAINT "encargo_projects_description_len" CHECK (char_length("encargo_projects"."description") <= 400),
	CONSTRAINT "encargo_projects_technique_detail_len" CHECK (char_length("encargo_projects"."technique_detail") <= 60),
	CONSTRAINT "encargo_projects_minimum_len" CHECK (char_length("encargo_projects"."minimum") <= 40),
	CONSTRAINT "encargo_projects_colors_len" CHECK (char_length("encargo_projects"."colors") <= 60),
	CONSTRAINT "encargo_projects_delivery_len" CHECK (char_length("encargo_projects"."delivery") <= 40),
	CONSTRAINT "encargo_projects_image_alt_len" CHECK (char_length("encargo_projects"."image_alt") <= 160),
	CONSTRAINT "encargo_projects_image_url_len" CHECK ("encargo_projects"."image_url" is null or char_length("encargo_projects"."image_url") <= 2048)
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "site_content_key" CHECK ("site_content"."key" = 'encargo')
);
--> statement-breakpoint
ALTER TABLE "site_content" ADD CONSTRAINT "site_content_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "encargo_projects_visible_sort_idx" ON "encargo_projects" USING btree ("visible","sort_order");