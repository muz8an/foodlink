
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('donor', 'ngo', 'volunteer', 'admin');
CREATE TYPE public.donation_status AS ENUM ('pending','accepted','picked_up','delivered','cancelled','expired');
CREATE TYPE public.delivery_status AS ENUM ('assigned','en_route_pickup','picked_up','en_route_delivery','delivered','failed');
CREATE TYPE public.food_type AS ENUM ('veg','non_veg','vegan','mixed');
CREATE TYPE public.urgency_level AS ENUM ('low','medium','high','critical');

-- ============ UTILITY ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  verified BOOLEAN NOT NULL DEFAULT false,
  organization_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES (separate, security definer check) ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'ngo' THEN 2 WHEN 'volunteer' THEN 3 WHEN 'donor' THEN 4 END
  LIMIT 1
$$;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users can self-assign initial role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role <> 'admin');

-- ============ SIGNUP TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, organization_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'organization_name'
  );

  _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role','')::public.app_role, 'donor');
  IF _role = 'admin' THEN _role := 'donor'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ DONATIONS ============
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ngo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  description TEXT,
  quantity TEXT NOT NULL,
  servings INT,
  food_type public.food_type NOT NULL DEFAULT 'veg',
  expiry_time TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  pickup_address TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status public.donation_status NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_donor ON public.donations(donor_id);
CREATE INDEX idx_donations_ngo ON public.donations(ngo_id);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view donations"
  ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Donors create own donations"
  ON public.donations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = donor_id AND public.has_role(auth.uid(),'donor'));
CREATE POLICY "Donor updates own donation"
  ON public.donations FOR UPDATE TO authenticated
  USING (auth.uid() = donor_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'ngo'));
CREATE POLICY "Donor or admin delete"
  ON public.donations FOR DELETE TO authenticated
  USING (auth.uid() = donor_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_donations_updated BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EMERGENCY REQUESTS ============
CREATE TABLE public.emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency public.urgency_level NOT NULL DEFAULT 'high',
  people_count INT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read emergencies"
  ON public.emergency_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "NGOs create emergencies"
  ON public.emergency_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ngo_id AND public.has_role(auth.uid(),'ngo'));
CREATE POLICY "NGO or admin update emergency"
  ON public.emergency_requests FOR UPDATE TO authenticated
  USING (auth.uid() = ngo_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "NGO or admin delete emergency"
  ON public.emergency_requests FOR DELETE TO authenticated
  USING (auth.uid() = ngo_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_emergency_updated BEFORE UPDATE ON public.emergency_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DELIVERIES ============
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ngo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.delivery_status NOT NULL DEFAULT 'assigned',
  pickup_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  proof_image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliveries_volunteer ON public.deliveries(volunteer_id);
CREATE INDEX idx_deliveries_donation ON public.deliveries(donation_id);
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read deliveries if involved"
  ON public.deliveries FOR SELECT TO authenticated USING (
    auth.uid() = volunteer_id OR auth.uid() = ngo_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid())
  );
CREATE POLICY "NGO or volunteer create delivery"
  ON public.deliveries FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'ngo') OR public.has_role(auth.uid(),'volunteer') OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Assigned volunteer or ngo update"
  ON public.deliveries FOR UPDATE TO authenticated USING (
    auth.uid() = volunteer_id OR auth.uid() = ngo_id OR public.has_role(auth.uid(),'admin')
  );

CREATE TRIGGER trg_deliveries_updated BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated insert notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ============ RATINGS ============
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (donation_id, rater_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read ratings authenticated"
  ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create own ratings"
  ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images','food-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-proof','delivery-proof', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read food images"
  ON storage.objects FOR SELECT USING (bucket_id IN ('food-images','delivery-proof','avatars'));
CREATE POLICY "Authenticated upload food images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('food-images','delivery-proof','avatars') AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('food-images','delivery-proof','avatars') AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('food-images','delivery-proof','avatars') AND auth.uid()::text = (storage.foldername(name))[1]);
