
-- Event status enum
CREATE TYPE public.event_status AS ENUM ('draft', 'live', 'ended');

-- Event voting type enum
CREATE TYPE public.event_voting_type AS ENUM ('monetary', 'free');

-- Vote rule for free events
CREATE TYPE public.event_vote_rule AS ENUM ('per_contestant', 'per_event');

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  banner_image TEXT,
  voting_type public.event_voting_type NOT NULL DEFAULT 'free',
  status public.event_status NOT NULL DEFAULT 'draft',
  vote_rule public.event_vote_rule NOT NULL DEFAULT 'per_contestant',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  -- Monetary event config
  paystack_public_key TEXT,
  paystack_secret_key TEXT,
  payment_currency TEXT NOT NULL DEFAULT 'NGN',
  min_vote_amount INTEGER NOT NULL DEFAULT 100,
  vote_conversion_rate INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event contestants
CREATE TABLE public.event_contestants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT,
  profile_image TEXT,
  video_url TEXT,
  description TEXT,
  total_votes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Students table (custom auth, separate from admin auth)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  matric_number TEXT NOT NULL UNIQUE,
  department TEXT,
  gender TEXT,
  date_of_birth DATE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event votes (for free voting)
CREATE TABLE public.event_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contestant_id UUID NOT NULL REFERENCES public.event_contestants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, contestant_id, student_id)
);

-- Event payments (for monetary voting)
CREATE TABLE public.event_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contestant_id UUID NOT NULL REFERENCES public.event_contestants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  voter_name TEXT,
  amount INTEGER NOT NULL,
  votes_purchased INTEGER NOT NULL,
  transaction_reference TEXT NOT NULL UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  ip_address TEXT,
  device_metadata JSONB,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event monetary votes
CREATE TABLE public.event_monetary_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contestant_id UUID NOT NULL REFERENCES public.event_contestants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.event_payments(id) ON DELETE CASCADE,
  votes_added INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_contestants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_monetary_votes ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Live events are publicly viewable" ON public.events FOR SELECT USING (status = 'live' OR status = 'ended' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Event contestants policies
CREATE POLICY "Event contestants are publicly viewable" ON public.event_contestants FOR SELECT USING (true);
CREATE POLICY "Admins can insert event contestants" ON public.event_contestants FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update event contestants" ON public.event_contestants FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete event contestants" ON public.event_contestants FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Students policies
CREATE POLICY "Students can view own profile" ON public.students FOR SELECT USING (true);
CREATE POLICY "Anyone can register as student" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Students can update own profile" ON public.students FOR UPDATE USING (true);

-- Event votes policies
CREATE POLICY "Event votes are publicly viewable" ON public.event_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert event votes" ON public.event_votes FOR INSERT WITH CHECK (true);

-- Event payments policies
CREATE POLICY "Admins can view event payments" ON public.event_payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert event payments" ON public.event_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update event payments" ON public.event_payments FOR UPDATE USING (true);

-- Event monetary votes policies
CREATE POLICY "Event monetary votes viewable" ON public.event_monetary_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert event monetary votes" ON public.event_monetary_votes FOR INSERT WITH CHECK (true);

-- Slug generation trigger for event contestants
CREATE OR REPLACE FUNCTION public.generate_event_contestant_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(trim(NEW.name), '[^a-zA-Z0-9]+', '-', 'g'));
    IF EXISTS (SELECT 1 FROM public.event_contestants WHERE slug = NEW.slug AND id != NEW.id AND event_id = NEW.event_id) THEN
      NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_event_contestant_slug BEFORE INSERT OR UPDATE ON public.event_contestants
FOR EACH ROW EXECUTE FUNCTION public.generate_event_contestant_slug();

-- Updated_at triggers
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_event_contestants_updated_at BEFORE UPDATE ON public.event_contestants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Increment votes function for event contestants
CREATE OR REPLACE FUNCTION public.increment_event_votes(p_contestant_id uuid, p_vote_count integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.event_contestants
  SET total_votes = total_votes + p_vote_count, updated_at = now()
  WHERE id = p_contestant_id;
END;
$$;

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_contestants;
