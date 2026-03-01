
-- Rename department column to design_title
ALTER TABLE public.contestants RENAME COLUMN department TO design_title;

-- Add new columns for profile image, description, biography, and slug
ALTER TABLE public.contestants ADD COLUMN profile_image text;
ALTER TABLE public.contestants ADD COLUMN design_description text;
ALTER TABLE public.contestants ADD COLUMN biography text;
ALTER TABLE public.contestants ADD COLUMN slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX idx_contestants_slug ON public.contestants(slug) WHERE slug IS NOT NULL;

-- Function to auto-generate slug from name
CREATE OR REPLACE FUNCTION public.generate_contestant_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(trim(NEW.name), '[^a-zA-Z0-9]+', '-', 'g'));
    -- Handle duplicates by appending random suffix
    IF EXISTS (SELECT 1 FROM public.contestants WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_slug
  BEFORE INSERT OR UPDATE ON public.contestants
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_contestant_slug();
