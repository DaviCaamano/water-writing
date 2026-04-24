ALTER TABLE "plans" ADD COLUMN "stripe_price_id" varchar(255);--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "subscription_status" varchar(50);--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;
