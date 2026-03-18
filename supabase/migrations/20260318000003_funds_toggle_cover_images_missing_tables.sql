-- ============================================================
-- Migration 4: Funds toggle + cover image fix + missing tables
-- ============================================================

-- 1. Per-event funds raised visibility toggle
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS show_funds_raised BOOLEAN NOT NULL DEFAULT true;

-- 2. Add cover_image column to event_contestants
--    (the magazine cover — distinct from profile headshot)
ALTER TABLE public.event_contestants
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 3. Add reviewed_by_admin to event_votes
--    (referenced in VoteMonitoringPanel but was missing)
ALTER TABLE public.event_votes
  ADD COLUMN IF NOT EXISTS reviewed_by_admin BOOLEAN NOT NULL DEFAULT false;

-- 4. Create student_whitelist table
--    (referenced in VoteMonitoringPanel but was never created)
CREATE TABLE IF NOT EXISTS public.student_whitelist (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matric_number TEXT NOT NULL UNIQUE,
  added_by     TEXT,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can manage whitelist"
  ON public.student_whitelist FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow edge function (service role) to read for student verification
CREATE POLICY IF NOT EXISTS "Anyone can read whitelist"
  ON public.student_whitelist FOR SELECT
  USING (true);

-- 5. Create contestant_media table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.contestant_media (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contestant_id UUID NOT NULL REFERENCES public.event_contestants(id) ON DELETE CASCADE,
  media_type    TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url           TEXT NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contestant_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Contestant media is publicly viewable"
  ON public.contestant_media FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage contestant media"
  ON public.contestant_media FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Service role can insert media"
  ON public.contestant_media FOR INSERT WITH CHECK (true);

-- 6. ── Fix migrated contestants: restore cover_image ─────────────────────
--    Match by slug (preserved during migration in step 2 of our earlier migration)
UPDATE public.event_contestants ec
SET cover_image = c.cover_image
FROM public.contestants c
WHERE ec.slug = c.slug
  AND ec.cover_image IS NULL
  AND c.cover_image IS NOT NULL;

-- 7. ── Populate contestant_media for migrated contestants ─────────────────
--    Insert cover_image as the PRIMARY image (sort_order 0) — the magazine cover
INSERT INTO public.contestant_media (contestant_id, media_type, url, is_primary, sort_order)
SELECT
  ec.id,
  'image',
  ec.cover_image,
  true,
  0
FROM public.event_contestants ec
WHERE ec.cover_image IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.contestant_media cm
    WHERE cm.contestant_id = ec.id AND cm.url = ec.cover_image
  );

-- 8. Insert profile_image as SECONDARY image (sort_order 1) — the headshot
--    Only if it's different from cover_image (avoid duplicates)
INSERT INTO public.contestant_media (contestant_id, media_type, url, is_primary, sort_order)
SELECT
  ec.id,
  'image',
  ec.profile_image,
  false,
  1
FROM public.event_contestants ec
WHERE ec.profile_image IS NOT NULL
  AND ec.profile_image IS DISTINCT FROM ec.cover_image
  AND NOT EXISTS (
    SELECT 1 FROM public.contestant_media cm
    WHERE cm.contestant_id = ec.id AND cm.url = ec.profile_image
  );

-- 9. Add index for contestant_media lookups
CREATE INDEX IF NOT EXISTS idx_contestant_media_contestant_id
  ON public.contestant_media (contestant_id, sort_order);

-- 10. Enable realtime for contestant_media (optional, for live admin updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.contestant_media;
