-- Snapshot reconciliation migration.
-- The actual schema changes were already captured by 0007 and 0008.
-- This migration advances Drizzle's snapshot history so future `generate`
-- runs stop re-emitting those older changes.
DO $$
BEGIN
  NULL;
END $$;
