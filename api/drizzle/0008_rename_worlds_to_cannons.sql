DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'worlds'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'cannons'
  ) THEN
    RAISE EXCEPTION 'Cannot migrate automatically because both "worlds" and "cannons" tables exist.';
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'worlds'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'cannons'
  ) THEN
    ALTER TABLE "worlds" RENAME TO "cannons";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cannons'
      AND column_name = 'world_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cannons'
      AND column_name = 'cannon_id'
  ) THEN
    ALTER TABLE "cannons" RENAME COLUMN "world_id" TO "cannon_id";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stories'
      AND column_name = 'world_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stories'
      AND column_name = 'cannon_id'
  ) THEN
    ALTER TABLE "stories" RENAME COLUMN "world_id" TO "cannon_id";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_worlds_user_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_cannons_user_id'
  ) THEN
    ALTER INDEX "idx_worlds_user_id" RENAME TO "idx_cannons_user_id";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_stories_world_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_stories_cannon_id'
  ) THEN
    ALTER INDEX "idx_stories_world_id" RENAME TO "idx_stories_cannon_id";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF to_regclass('public.cannons') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = to_regclass('public.cannons')
        AND conname = 'worlds_pkey'
    ) THEN
    ALTER TABLE "cannons" RENAME CONSTRAINT "worlds_pkey" TO "cannons_pkey";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF to_regclass('public.cannons') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = to_regclass('public.cannons')
        AND conname = 'worlds_user_id_users_user_id_fk'
    ) THEN
    ALTER TABLE "cannons"
      RENAME CONSTRAINT "worlds_user_id_users_user_id_fk" TO "cannons_user_id_users_user_id_fk";
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF to_regclass('public.stories') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = to_regclass('public.stories')
        AND conname = 'stories_world_id_worlds_world_id_fk'
    ) THEN
    ALTER TABLE "stories"
      RENAME CONSTRAINT "stories_world_id_worlds_world_id_fk" TO "stories_cannon_id_cannons_cannon_id_fk";
  END IF;
END $$;
