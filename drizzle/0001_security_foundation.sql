CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"target" text,
	"outcome" text NOT NULL,
	"ip_hash" text,
	"request_id" text,
	"metadata" jsonb,
	CONSTRAINT "audit_events_actor_type" CHECK ("audit_events"."actor_type" in ('admin', 'system', 'integration', 'webhook')),
	CONSTRAINT "audit_events_outcome" CHECK ("audit_events"."outcome" in ('success', 'failure', 'denied'))
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"status" text NOT NULL,
	"response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "idempotency_keys_scope_key_pk" PRIMARY KEY("scope","key"),
	CONSTRAINT "idempotency_keys_status" CHECK ("idempotency_keys"."status" in ('in_progress', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	CONSTRAINT "webhook_events_provider_event_unique" UNIQUE("provider","event_id"),
	CONSTRAINT "webhook_events_status" CHECK ("webhook_events"."status" in ('received', 'processed', 'failed'))
);
--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_events_action_created_idx" ON "audit_events" USING btree ("action","created_at");