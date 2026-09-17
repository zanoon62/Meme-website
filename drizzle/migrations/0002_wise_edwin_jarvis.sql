CREATE TABLE "payment_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "size_chart" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_proof_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_sender_info" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_confirmed_by" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmation_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_confirmed_by_users_id_fk" FOREIGN KEY ("payment_confirmed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;