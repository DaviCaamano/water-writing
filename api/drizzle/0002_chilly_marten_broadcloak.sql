DROP INDEX "idx_plans_one_active_per_user";--> statement-breakpoint
DROP INDEX "idx_plans_user_id";--> statement-breakpoint
ALTER TABLE "plans" DROP CONSTRAINT "plans_pkey";--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "plan_id";--> statement-breakpoint
ALTER TABLE "plans" ADD PRIMARY KEY ("user_id");
