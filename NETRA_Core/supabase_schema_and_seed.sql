-- =============================================================================
-- NETRA Dashboard - Supabase Schema & Initial Seed
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uzrnqvzryuswkccmekqn/sql/new
-- =============================================================================

-- 1. CAMERAS
CREATE TABLE IF NOT EXISTS public.cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'warning', 'offline'
    type TEXT DEFAULT 'fixed',    -- 'fixed', 'ptz'
    zone TEXT,
    speed_limit INTEGER DEFAULT 60,
    vehicles_detected INTEGER DEFAULT 0,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    plate TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'car',      -- 'car', 'truck', 'bike', 'bus'
    make TEXT,
    color TEXT,
    status TEXT DEFAULT 'tracked', -- 'tracked', 'flagged'
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    total_sightings INTEGER DEFAULT 1,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VEHICLE SIGHTINGS / TRAJECTORIES
CREATE TABLE IF NOT EXISTS public.vehicle_sightings (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    camera_id TEXT,
    camera_name TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed INTEGER,
    confidence NUMERIC(4, 2) DEFAULT 0.95,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,           -- 'overspeeding', 'stolen_vehicle', 'unauthorized_entry', etc.
    severity TEXT NOT NULL,       -- 'critical', 'high', 'medium', 'low'
    status TEXT DEFAULT 'active', -- 'active', 'investigating', 'resolved'
    vehicle_plate TEXT,
    vehicle_id TEXT,
    camera_id TEXT,
    location TEXT,
    description TEXT,
    speed_detected INTEGER,
    speed_limit INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    monitoring BOOLEAN DEFAULT TRUE,
    show_camera_markers BOOLEAN DEFAULT TRUE,
    show_camera_labels BOOLEAN DEFAULT TRUE,
    show_traffic_density BOOLEAN DEFAULT TRUE,
    auto_center_map BOOLEAN DEFAULT FALSE,
    critical_alerts BOOLEAN DEFAULT TRUE,
    high_alerts BOOLEAN DEFAULT TRUE,
    medium_alerts BOOLEAN DEFAULT TRUE,
    low_alerts BOOLEAN DEFAULT FALSE,
    refresh_interval TEXT DEFAULT '30s',
    theme TEXT DEFAULT 'Dark',
    language TEXT DEFAULT 'English',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read and write access for application operations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read cameras') THEN
    CREATE POLICY "Allow public read cameras" ON public.cameras FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read vehicles') THEN
    CREATE POLICY "Allow public read vehicles" ON public.vehicles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all vehicles') THEN
    CREATE POLICY "Allow public all vehicles" ON public.vehicles FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read sightings') THEN
    CREATE POLICY "Allow public read sightings" ON public.vehicle_sightings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all sightings') THEN
    CREATE POLICY "Allow public all sightings" ON public.vehicle_sightings FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read alerts') THEN
    CREATE POLICY "Allow public read alerts" ON public.alerts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all alerts') THEN
    CREATE POLICY "Allow public all alerts" ON public.alerts FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all settings') THEN
    CREATE POLICY "Allow public all settings" ON public.user_settings FOR ALL USING (true);
  END IF;
END $$;

-- 7. ENABLE REALTIME REPLICATION FOR LIVE DASHBOARD UPDATES
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_sightings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cameras;

-- =============================================================================
-- SEED DATA (Mumbai Urban Corridor Initial Data)
-- =============================================================================

INSERT INTO public.cameras (id, name, latitude, longitude, status, type, zone, vehicles_detected, speed_limit)
VALUES
  ('CAM-001', 'Bandra-Worli Sea Link Toll', 19.0270, 72.8180, 'active', 'fixed', 'Mumbai West', 3420, 80),
  ('CAM-002', 'Sion Circle Junction', 19.0390, 72.8619, 'active', 'ptz', 'Central Corridor', 2890, 50),
  ('CAM-003', 'Vashi Bridge Toll Plaza', 19.0620, 72.9850, 'warning', 'fixed', 'Navi Mumbai Entry', 4150, 60),
  ('CAM-004', 'Palm Beach Road Sector-19', 19.0195, 73.0200, 'offline', 'fixed', 'Navi Mumbai South', 820, 70),
  ('CAM-005', 'Eastern Freeway Chembur Exit', 19.0550, 72.8880, 'active', 'ptz', 'Mumbai East', 1980, 80),
  ('CAM-006', 'Marine Drive Promenade', 18.9430, 72.8230, 'active', 'fixed', 'South Mumbai', 2640, 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vehicles (id, plate, type, make, color, status, flagged, flag_reason, current_lat, current_lng, total_sightings)
VALUES
  ('VH-1001', 'MH 01 AV 1234', 'car', 'Maruti Swift', 'white', 'tracked', false, null, 19.0270, 72.8180, 6),
  ('VH-1002', 'MH 04 BT 9876', 'truck', 'Tata LPT 1613', 'blue', 'flagged', true, 'Suspected stolen vehicle', 19.0390, 72.8619, 12),
  ('VH-1003', 'MH 02 CZ 4521', 'car', 'Hyundai Creta', 'silver', 'tracked', false, null, 19.0550, 72.8880, 4),
  ('VH-1004', 'MH 47 XY 7711', 'bike', 'Bajaj Pulsar', 'black', 'flagged', true, 'Multiple overspeeding violations', 18.9430, 72.8230, 8),
  ('VH-1005', 'MH 12 QP 3344', 'bus', 'Ashok Leyland Starbus', 'red', 'tracked', false, null, 19.0620, 72.9850, 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.alerts (id, type, severity, status, vehicle_plate, vehicle_id, camera_id, location, description, speed_detected, speed_limit)
VALUES
  ('ALT-8801', 'stolen_vehicle', 'critical', 'active', 'MH 04 BT 9876', 'VH-1002', 'CAM-002', 'Sion Circle Junction', 'Flagged stolen vehicle detected moving south towards Matunga', null, 50),
  ('ALT-8802', 'overspeeding', 'high', 'investigating', 'MH 47 XY 7711', 'VH-1004', 'CAM-006', 'Marine Drive Promenade', 'Vehicle detected at 104 km/h in a 60 km/h zone', 104, 60),
  ('ALT-8803', 'unauthorized_entry', 'medium', 'active', 'MH 01 AV 1234', 'VH-1001', 'CAM-001', 'Bandra-Worli Sea Link Toll', 'Entry during restricted maintenance window', 72, 80),
  ('ALT-8804', 'congestion_surge', 'low', 'resolved', null, null, 'CAM-003', 'Vashi Bridge Toll Plaza', 'Traffic density exceeded 85% threshold on westbound lanes', null, 60)
ON CONFLICT (id) DO NOTHING;
