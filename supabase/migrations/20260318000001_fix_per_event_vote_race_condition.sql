-- ============================================================
-- Migration: Fix per_event voting race condition
-- ============================================================

-- Drop the old unique constraint that only covers per_contestant logic
ALTER TABLE public.event_votes
  DROP CONSTRAINT IF EXISTS event_votes_event_id_contestant_id_student_id_key;

-- Re-add the per_contestant constraint (same as before, needed for per_contestant rule)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_votes_per_contestant
  ON public.event_votes (event_id, contestant_id, student_id);

-- Add a separate unique index for per_event rule:
-- A student can only appear ONCE per event regardless of contestant
-- This is enforced at the DB level, eliminating the race condition
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_votes_per_event
  ON public.event_votes (event_id, student_id);

-- NOTE: The per_contestant index still exists so both rules are enforced
-- at the database level without relying solely on application logic.
-- The Edge Function's vote_rule check determines which error message
-- to show the user, but the DB now prevents duplicates either way.
