-- =============================================================================
-- NETRA Dashboard - Personnel & Login Authentication Database
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uzrnqvzryuswkccmekqn/sql/new
-- =============================================================================

-- 1. CREATE USER PROFILES / PERSONNEL DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'Command Officer',       -- 'System Admin', 'Command Officer', 'Traffic Analyst', 'Patrol Lead'
    department TEXT DEFAULT 'Central Traffic Command',
    badge_id TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES FOR READING AND UPDATING PROFILES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public lookup by org_id or email') THEN
    CREATE POLICY "Allow public lookup by org_id or email" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert on registration') THEN
    CREATE POLICY "Allow insert on registration" ON public.profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow update own profile') THEN
    CREATE POLICY "Allow update own profile" ON public.profiles FOR UPDATE USING (true);
  END IF;
END $$;

-- 4. AUTOMATIC PROFILE CREATION TRIGGER ON SUPABASE AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, org_id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'org_id', 'ORG-' || SUBSTRING(NEW.id::text, 1, 6)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Operator ' || SUBSTRING(NEW.email FROM 1 FOR 5)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Command Officer')
  )
  ON CONFLICT (email) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      last_login = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. SEED INITIAL COMMAND PERSONNEL ACCOUNTS
-- You can log in using these Organization IDs or your own created accounts!
INSERT INTO public.profiles (org_id, email, full_name, role, department, badge_id)
VALUES
  ('NETRA-HQ-01', 'commander@netra.gov.in', 'Command Officer', 'Command Director', 'Metropolitan Security & Traffic Command', 'BADGE-901'),
  ('MUMBAI-POLICE-02', 'operator@netra.gov.in', 'Sub-Inspector Ananya Sharma', 'Surveillance Lead', 'Navi Mumbai & Sea Link Operations', 'BADGE-442'),
  ('TRAFFIC-ANALYST-03', 'analyst@netra.gov.in', 'Sr. Analyst Rohan Deshmukh', 'AI Telemetry Analyst', 'Urban Mobility & Congestion Intelligence', 'BADGE-118')
ON CONFLICT (org_id) DO NOTHING;
