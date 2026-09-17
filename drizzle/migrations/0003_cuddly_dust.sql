CREATE TABLE "shipping_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
