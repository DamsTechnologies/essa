-- ============================================================
-- Migration 1: Fix event_votes columns + create vote_audit_log
-- ============================================================

-- 1. Add fraud-detection columns to event_votes
ALTER TABLE public.event_votes
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS suspicious_activity BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason TEXT;

-- 2. Add indexes for fraud analysis queries
CREATE INDEX IF NOT EXISTS idx_event_votes_ip_created
  ON public.event_votes (ip_address, created_at)
  WHERE ip_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_votes_student_event
  ON public.event_votes (student_id, event_id);

CREATE INDEX IF NOT EXISTS idx_event_votes_suspicious
  ON public.event_votes (suspicious_activity)
  WHERE suspicious_activity = true;

-- 3. Create vote_audit_log table
CREATE TABLE IF NOT EXISTS public.vote_audit_log (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action         TEXT NOT NULL,
  admin_id       TEXT NOT NULL DEFAULT 'system',
  event_id       UUID REFERENCES public.events(id) ON DELETE SET NULL,
  contestant_id  UUID REFERENCES public.event_contestants(id) ON DELETE SET NULL,
  vote_id        UUID REFERENCES public.event_votes(id) ON DELETE SET NULL,
  details        TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on audit log
ALTER TABLE public.vote_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vote audit log"
  ON public.vote_audit_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert vote audit log"
  ON public.vote_audit_log
  FOR INSERT
  WITH CHECK (true);

-- 5. Add voting_paused column to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS voting_paused BOOLEAN NOT NULL DEFAULT false;

-- 6. Enable realtime for vote_audit_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.vote_audit_log;
