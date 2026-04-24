CREATE TYPE "public"."stripe_subscription_status" AS ENUM (
	'incomplete',
	'incomplete_expired',
	'trialing',
	'active',
	'past_due',
	'canceled',
	'unpaid',
	'paused'
);--> statement-breakpoint

ALTER TABLE "plans"
ALTER COLUMN "subscription_status" TYPE "public"."stripe_subscription_status"
USING CASE
	WHEN "subscription_status" IS NULL THEN NULL
	WHEN "subscription_status" IN (
		'incomplete',
		'incomplete_expired',
		'trialing',
		'active',
		'past_due',
		'canceled',
		'unpaid',
		'paused'
	) THEN "subscription_status"::"public"."stripe_subscription_status"
	ELSE NULL
END;
