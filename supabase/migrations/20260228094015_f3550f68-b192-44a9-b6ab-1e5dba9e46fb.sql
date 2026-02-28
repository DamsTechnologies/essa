
-- Create contestants table
CREATE TABLE public.contestants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  total_votes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  voter_name TEXT,
  amount INTEGER NOT NULL,
  votes_purchased INTEGER NOT NULL,
  contestant_id UUID NOT NULL REFERENCES public.contestants(id) ON DELETE CASCADE,
  transaction_reference TEXT NOT NULL UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  device_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contestant_id UUID NOT NULL REFERENCES public.contestants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  votes_added INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contest_settings table
CREATE TABLE public.contest_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_name TEXT NOT NULL DEFAULT 'Fashion Magazine Cover Contest',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  winner_id UUID REFERENCES public.contestants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.contest_settings (contest_name) VALUES ('Mass Communication Fashion Magazine Cover Contest');

-- Admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Atomically increment votes
CREATE OR REPLACE FUNCTION public.increment_votes(p_contestant_id UUID, p_vote_count INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contestants
  SET total_votes = total_votes + p_vote_count, updated_at = now()
  WHERE id = p_contestant_id;
END;
$$;

-- Enable RLS
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Contestants: publicly readable, admin-writable
CREATE POLICY "Contestants are publicly viewable" ON public.contestants FOR SELECT USING (true);
CREATE POLICY "Admins can insert contestants" ON public.contestants FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contestants" ON public.contestants FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contestants" ON public.contestants FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Payments: admin-readable, publicly insertable (for payment init)
CREATE POLICY "Admins can view payments" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payments" ON public.payments FOR UPDATE USING (true);

-- Votes: publicly readable, publicly insertable
CREATE POLICY "Votes are publicly viewable" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.votes FOR INSERT WITH CHECK (true);

-- Contest settings
CREATE POLICY "Contest settings are publicly viewable" ON public.contest_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update contest settings" ON public.contest_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for contestants
ALTER PUBLICATION supabase_realtime ADD TABLE public.contestants;

-- Storage bucket for contestant images
INSERT INTO storage.buckets (id, name, public) VALUES ('contestant-images', 'contestant-images', true);

CREATE POLICY "Contestant images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'contestant-images');
CREATE POLICY "Anyone can upload contestant images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contestant-images');
CREATE POLICY "Anyone can update contestant images" ON storage.objects FOR UPDATE USING (bucket_id = 'contestant-images');
CREATE POLICY "Anyone can delete contestant images" ON storage.objects FOR DELETE USING (bucket_id = 'contestant-images');

-- Timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_contestants_updated_at
  BEFORE UPDATE ON public.contestants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contest_settings_updated_at
  BEFORE UPDATE ON public.contest_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
