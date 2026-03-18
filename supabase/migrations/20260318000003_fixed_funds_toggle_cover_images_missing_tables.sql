-- ============================================================
-- Migration 4 (FIXED): Funds toggle + cover image fix + missing tables
-- ============================================================

-- 1. Per-event funds raised visibility toggle
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS show_funds_raised BOOLEAN NOT NULL DEFAULT true;

-- 2. Add cover_image column to event_contestants
ALTER TABLE public.event_contestants
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 3. Add reviewed_by_admin to event_votes
ALTER TABLE public.event_votes
  ADD COLUMN IF NOT EXISTS reviewed_by_admin BOOLEAN NOT NULL DEFAULT false;

-- 4. Create student_whitelist table
CREATE TABLE IF NOT EXISTS public.student_whitelist (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matric_number TEXT NOT NULL UNIQUE,
  added_by      TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_whitelist ENABLE ROW LEVEL SECURITY;

-- Drop policies before recreating (avoids duplicate errors)
DROP POLICY IF EXISTS "Admins can manage whitelist" ON public.student_whitelist;
DROP POLICY IF EXISTS "Anyone can read whitelist" ON public.student_whitelist;

CREATE POLICY "Admins can manage whitelist"
  ON public.student_whitelist FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read whitelist"
  ON public.student_whitelist FOR SELECT
  USING (true);

-- 5. Create contestant_media table
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

DROP POLICY IF EXISTS "Contestant media is publicly viewable" ON public.contestant_media;
DROP POLICY IF EXISTS "Admins can manage contestant media" ON public.contestant_media;
DROP POLICY IF EXISTS "Service role can insert media" ON public.contestant_media;

CREATE POLICY "Contestant media is publicly viewable"
  ON public.contestant_media FOR SELECT USING (true);

CREATE POLICY "Admins can manage contestant media"
  ON public.contestant_media FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert media"
  ON public.contestant_media FOR INSERT WITH CHECK (true);

-- 6. Restore cover_image for migrated contestants by matching slug
UPDATE public.event_contestants ec
SET cover_image = c.cover_image
FROM public.contestants c
WHERE ec.slug = c.slug
  AND ec.cover_image IS NULL
  AND c.cover_image IS NOT NULL;

-- 7. Populate contestant_media — cover_image as PRIMARY (sort 0)
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

-- 8. Populate contestant_media — profile_image as SECONDARY (sort 1)
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

-- 9. Index for fast media lookups
CREATE INDEX IF NOT EXISTS idx_contestant_media_contestant_id
  ON public.contestant_media (contestant_id, sort_order);

-- 10. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contestant_media;
