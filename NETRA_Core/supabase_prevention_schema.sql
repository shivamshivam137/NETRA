-- =============================================================================
-- NETRA Dashboard - Traffic Prevention & Control Schema & Initial Seed
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uzrnqvzryuswkccmekqn/sql/new
-- =============================================================================

-- 1. TRAFFIC INCIDENTS
CREATE TABLE IF NOT EXISTS public.traffic_incidents (
    id TEXT PRIMARY KEY,
    corridor TEXT NOT NULL,
    camera_id TEXT REFERENCES public.cameras(id) ON DELETE SET NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    severity TEXT NOT NULL DEFAULT 'CRITICAL', -- 'CRITICAL', 'HEAVY', 'MODERATE', 'NORMAL'
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'EXECUTING', 'EXECUTED', 'REJECTED'
    vehicles_detected INTEGER DEFAULT 127,
    avg_speed INTEGER DEFAULT 11,
    congestion_index INTEGER DEFAULT 92,
    queue_length_meters INTEGER DEFAULT 420,
    flow_imbalance_ratio TEXT DEFAULT '3.02 : 1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PREVENTION PLANS
CREATE TABLE IF NOT EXISTS public.traffic_prevention_plans (
    id TEXT PRIMARY KEY,
    incident_id TEXT REFERENCES public.traffic_incidents(id) ON DELETE CASCADE,
    recommended_actions JSONB NOT NULL,
    decision_rationale JSONB NOT NULL,
    current_signal_ns INTEGER DEFAULT 30,
    current_signal_ew INTEGER DEFAULT 30,
    proposed_signal_ns INTEGER DEFAULT 45,
    proposed_signal_ew INTEGER DEFAULT 15,
    current_corridor_minutes INTEGER DEFAULT 12,
    alternate_corridor_minutes INTEGER DEFAULT 7,
    time_saved_minutes INTEGER DEFAULT 5,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.traffic_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_prevention_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read traffic_incidents') THEN
    CREATE POLICY "Allow public read traffic_incidents" ON public.traffic_incidents FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all traffic_incidents') THEN
    CREATE POLICY "Allow public all traffic_incidents" ON public.traffic_incidents FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read prevention_plans') THEN
    CREATE POLICY "Allow public read prevention_plans" ON public.traffic_prevention_plans FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all prevention_plans') THEN
    CREATE POLICY "Allow public all prevention_plans" ON public.traffic_prevention_plans FOR ALL USING (true);
  END IF;
END $$;

-- 4. REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_prevention_plans;

-- 5. INITIAL SEED
INSERT INTO public.traffic_incidents (
    id, corridor, camera_id, location_lat, location_lng, severity, status, 
    vehicles_detected, avg_speed, congestion_index, queue_length_meters, flow_imbalance_ratio
) VALUES (
    'INC-TRF-9021',
    'Vashi Bridge Toll & Central Link (CAM-003 Corridor)',
    'CAM-003',
    19.0620,
    72.9850,
    'CRITICAL',
    'PENDING_APPROVAL',
    127,
    11,
    92,
    420,
    '3.02 : 1'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.traffic_prevention_plans (
    id, incident_id, recommended_actions, decision_rationale,
    current_signal_ns, current_signal_ew, proposed_signal_ns, proposed_signal_ew,
    current_corridor_minutes, alternate_corridor_minutes, time_saved_minutes
) VALUES (
    'PLAN-9021',
    'INC-TRF-9021',
    '["SIGNAL_TIMING_OPTIMIZATION", "ALTERNATE_ROUTE_RECOMMENDATION", "TRAFFIC_DIVERSION"]'::jsonb,
    '["North-South vehicle volume (127) is 3x higher than East-West volume (42)", "North-South average crawl speed is 11 km/h vs 29 km/h on cross-streets", "Vehicle trajectory data shows incoming flows from CAM-001 heading towards CAM-003 bottleneck"]'::jsonb,
    30, 30, 45, 15,
    12, 7, 5
) ON CONFLICT (id) DO NOTHING;
