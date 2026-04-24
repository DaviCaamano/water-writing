ALTER TABLE "plans"
ADD COLUMN "renew_date" timestamp with time zone DEFAULT now() NOT NULL;
