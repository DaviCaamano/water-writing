DO $$
BEGIN
  CREATE TYPE "public"."renew_on" AS ENUM ('monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

ALTER TABLE "plans" RENAME COLUMN "is_active" TO "renew_on";--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "renew_on" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "plans"
ALTER COLUMN "renew_on" TYPE "public"."renew_on"
USING (
  CASE
    WHEN "renew_on" = TRUE THEN
      CASE
        WHEN "is_year_plan" = TRUE THEN 'yearly'
        ELSE 'monthly'
      END
    ELSE NULL
  END
)::"public"."renew_on";
