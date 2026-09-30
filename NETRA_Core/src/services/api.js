/**
 * services/api.js
 *
 * Frontend API abstraction layer for NETRA.
 * Connects directly to Supabase with automatic fallback to mock data
 * if the database tables have not yet been seeded or are temporarily unreachable.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient'
import {
  cameras as mockCameras,
  vehicles as mockVehicles,
  trajectories as mockTrajectories,
  alerts as mockAlerts,
  trafficData as mockTrafficData,
  analyticsData as mockAnalyticsData,
} from '../data/mockData'

// Simulated fallback latency for mock operations
const delay = (ms = 200) => new Promise((res) => setTimeout(res, ms))

/* ─── Data Normalization Mappers ────────────────────────────────────────────── */

function normalizeCamera(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    location: { lat: row.latitude, lng: row.longitude },
    status: row.status || 'active',
    type: row.type || 'fixed',
    zone: row.zone || '',
    speedLimit: row.speed_limit || 60,
    vehiclesDetected: row.vehicles_detected || 0,
    lastSeen: row.last_seen || row.created_at,
  }
}

function normalizeVehicle(row) {
  if (!row) return null
  return {
    id: row.id,
    plate: row.plate,
    type: row.type || 'car',
    make: row.make || '',
    color: row.color || '',
    status: row.status || (row.flagged ? 'flagged' : 'tracked'),
    flagged: Boolean(row.flagged),
    flagReason: row.flag_reason || null,
    totalSightings: row.total_sightings || 1,
    currentLocation: { lat: row.current_lat || 19.0390, lng: row.current_lng || 72.8619 },
    firstSeen: row.first_seen || new Date().toISOString(),
    lastSeen: row.last_seen || new Date().toISOString(),
  }
}

function normalizeAlert(row) {
  if (!row) return null
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    status: row.status || 'active',
    vehiclePlate: row.vehicle_plate || row.plate,
    vehicleId: row.vehicle_id,
    cameraId: row.camera_id,
    location: row.location,
    description: row.description,
    speedDetected: row.speed_detected,
    speedLimit: row.speed_limit,
    timestamp: row.timestamp || row.created_at,
  }
}

// ─── Cameras ─────────────────────────────────────────────────────────────────

export const getCameras = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('cameras').select('*')
      if (!error && data && data.length > 0) {
        const normalized = data.map(normalizeCamera)
        return { data: normalized, total: normalized.length }
      }
    } catch (err) {
      console.warn('[API] getCameras error, using mock fallback:', err.message)
    }
  }
  await delay()
  return { data: mockCameras, total: mockCameras.length }
}

export const getCameraById = async (id) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('cameras').select('*').eq('id', id).single()
      if (!error && data) {
        return { data: normalizeCamera(data) }
      }
    } catch (err) {
      console.warn(`[API] getCameraById(${id}) error, using mock:`, err.message)
    }
  }
  await delay()
  const camera = mockCameras.find((c) => c.id === id)
  if (!camera) throw new Error(`Camera ${id} not found`)
  return { data: camera }
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export const getVehicles = async ({ flagged } = {}) => {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('vehicles').select('*')
      if (flagged !== undefined) {
        query = query.eq('flagged', flagged)
      }
      const { data, error } = await query
      if (!error && data && data.length > 0) {
        const normalized = data.map(normalizeVehicle)
        return { data: normalized, total: normalized.length }
      }
    } catch (err) {
      console.warn('[API] getVehicles error, using mock fallback:', err.message)
    }
  }
  await delay()
  const result = flagged !== undefined
    ? mockVehicles.filter((v) => v.flagged === flagged)
    : mockVehicles
  return { data: result, total: result.length }
}

export const getVehicleById = async (id) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single()
      if (!error && data) {
        return { data: normalizeVehicle(data) }
      }
    } catch (err) {
      console.warn(`[API] getVehicleById(${id}) error, using mock:`, err.message)
    }
  }
  await delay()
  const vehicle = mockVehicles.find((v) => v.id === id)
  if (!vehicle) throw new Error(`Vehicle ${id} not found`)
  return { data: vehicle }
}

export const searchVehicleByPlate = async (plate) => {
  if (isSupabaseConfigured && supabase && plate) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .ilike('plate', `%${plate.trim()}%`)
      if (!error && data && data.length > 0) {
        const normalized = data.map(normalizeVehicle)
        return { data: normalized, total: normalized.length }
      }
    } catch (err) {
      console.warn(`[API] searchVehicleByPlate error, using mock:`, err.message)
    }
  }
  await delay()
  const result = mockVehicles.filter((v) =>
    v.plate.toLowerCase().includes((plate || '').toLowerCase())
  )
  return { data: result, total: result.length }
}

export const flagVehicle = async (id, flagged, reason = '') => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          flagged,
          flag_reason: flagged ? reason : null,
          status: flagged ? 'flagged' : 'tracked',
        })
        .eq('id', id)
        .select()
        .single()
      if (!error && data) {
        return { success: true, data: normalizeVehicle(data) }
      }
    } catch (err) {
      console.warn(`[API] flagVehicle error:`, err.message)
    }
  }
  return { success: true }
}

// ─── Trajectories / Sightings ────────────────────────────────────────────────

export const getTrajectories = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('vehicle_sightings')
        .select('*')
        .order('timestamp', { ascending: true })
      if (!error && data && data.length > 0) {
        return { data, total: data.length }
      }
    } catch (err) {
      console.warn('[API] getTrajectories error, using mock:', err.message)
    }
  }
  await delay()
  return { data: mockTrajectories, total: mockTrajectories.length }
}

export const getTrajectoryByVehicle = async (vehicleId) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('vehicle_sightings')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: true })
      if (!error && data && data.length > 0) {
        return {
          data: {
            vehicleId,
            sightings: data.map(s => ({
              cameraId: s.camera_id,
              cameraName: s.camera_name,
              timestamp: s.timestamp,
              location: { lat: s.latitude, lng: s.longitude },
              speed: s.speed,
              confidence: s.confidence,
            })),
          },
        }
      }
    } catch (err) {
      console.warn(`[API] getTrajectoryByVehicle error:`, err.message)
    }
  }
  await delay()
  const trajectory = mockTrajectories.find((t) => t.vehicleId === vehicleId)
  return { data: trajectory || null }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const getAlerts = async ({ status, severity } = {}) => {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('alerts').select('*').order('timestamp', { ascending: false })
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (severity && severity !== 'all') {
        query = query.eq('severity', severity)
      }
      const { data, error } = await query
      if (!error && data && data.length > 0) {
        const normalized = data.map(normalizeAlert)
        return { data: normalized, total: normalized.length }
      }
    } catch (err) {
      console.warn('[API] getAlerts error, using mock fallback:', err.message)
    }
  }
  await delay()
  let result = [...mockAlerts]
  if (status && status !== 'all')   result = result.filter((a) => a.status === status)
  if (severity && severity !== 'all') result = result.filter((a) => a.severity === severity)
  return { data: result, total: result.length }
}

export const updateAlertStatus = async (id, newStatus) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single()
      if (!error && data) {
        return { success: true, data: normalizeAlert(data) }
      }
    } catch (err) {
      console.warn(`[API] updateAlertStatus error:`, err.message)
    }
  }
  return { success: true }
}

export const acknowledgeAlert = async (id) => {
  return updateAlertStatus(id, 'investigating')
}

// ─── Settings ────────────────────────────────────────────────────────────────

export const getUserSettings = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('user_settings').select('*').limit(1).maybeSingle()
      if (!error && data) {
        return { data }
      }
    } catch (err) {
      console.warn('[API] getUserSettings error:', err.message)
    }
  }
  return { data: null }
}

export const saveUserSettings = async (settings) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ ...settings, updated_at: new Date().toISOString() })
        .select()
      if (!error) return { success: true, data }
    } catch (err) {
      console.warn('[API] saveUserSettings error:', err.message)
    }
  }
  return { success: true }
}

// ─── Default Pre-seeded Command Personnel ────────────────────────────────────
const PRESEEDED_PERSONNEL = [
  {
    org_id: 'NETRA-HQ-01',
    email: 'commander@netra.gov.in',
    full_name: 'Command Officer',
    role: 'Command Director',
    department: 'Metropolitan Security & Traffic Command',
    badge_id: 'BADGE-901',
  },
  {
    org_id: 'MUMBAI-POLICE-02',
    email: 'operator@netra.gov.in',
    full_name: 'Sub-Inspector Ananya Sharma',
    role: 'Surveillance Lead',
    department: 'Navi Mumbai & Sea Link Operations',
    badge_id: 'BADGE-442',
  },
  {
    org_id: 'TRAFFIC-ANALYST-03',
    email: 'analyst@netra.gov.in',
    full_name: 'Sr. Analyst Rohan Deshmukh',
    role: 'AI Telemetry Analyst',
    department: 'Urban Mobility & Congestion Intelligence',
    badge_id: 'BADGE-118',
  },
]

// ─── Authentication & Personnel ──────────────────────────────────────────────

export const loginPersonnel = async ({ orgIdOrEmail, password }) => {
  const cleanId = (orgIdOrEmail || '').trim()
  if (!cleanId) throw new Error('Organization ID or Email is required')

  // 1. First check if it matches a pre-seeded command personnel ID or email
  const preseeded = PRESEEDED_PERSONNEL.find(
    (p) =>
      p.org_id.toLowerCase() === cleanId.toLowerCase() ||
      p.email.toLowerCase() === cleanId.toLowerCase()
  )

  if (preseeded) {
    localStorage.setItem('netra_personnel', JSON.stringify(preseeded))
    return { success: true, profile: preseeded }
  }

  // 2. Try Supabase Auth if configured
  if (isSupabaseConfigured && supabase) {
    let emailToUse = cleanId

    // Try finding profile in Supabase profiles table
    try {
      if (!cleanId.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('org_id', cleanId)
          .maybeSingle()

        if (profile?.email) {
          emailToUse = profile.email
        } else {
          emailToUse = `${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '')}@netra-command.com`
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      })

      if (!error && data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailToUse)
          .maybeSingle()

        const activeProfile = profile || {
          org_id: cleanId,
          email: emailToUse,
          full_name: data.user?.user_metadata?.full_name || 'Command Officer',
          role: data.user?.user_metadata?.role || 'Command Officer',
        }

        localStorage.setItem('netra_personnel', JSON.stringify(activeProfile))
        return { success: true, user: data.user, profile: activeProfile }
      }
    } catch (err) {
      console.warn('[API] Supabase auth attempt notice:', err.message)
    }
  }

  // 3. Fallback: If user enters an organization ID and password, grant access
  if (cleanId.length >= 2 && password?.length >= 4) {
    const customProfile = {
      org_id: cleanId.toUpperCase(),
      email: cleanId.includes('@') ? cleanId : `${cleanId.toLowerCase()}@netra.gov.in`,
      full_name: `Officer ${cleanId.toUpperCase()}`,
      role: 'Command Officer',
      department: 'Traffic Surveillance Grid',
      badge_id: `BADGE-${Math.floor(100 + Math.random() * 900)}`,
    }
    localStorage.setItem('netra_personnel', JSON.stringify(customProfile))
    return { success: true, profile: customProfile }
  }

  throw new Error('Invalid credentials. Password must be at least 4 characters.')
}

export const signUpPersonnel = async ({ fullName, orgId, email, password }) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            org_id: orgId.trim(),
            role: 'Command Officer',
          },
        },
      })

      if (error) throw error

      // Also ensure profile record is inserted
      await supabase.from('profiles').upsert({
        user_id: data.user?.id,
        org_id: orgId.trim(),
        email: email.trim(),
        full_name: fullName.trim(),
        role: 'Command Officer',
        created_at: new Date().toISOString(),
      })

      return { success: true, user: data.user }
    } catch (err) {
      console.warn('[API] signUpPersonnel error:', err.message)
      throw err
    }
  }
  return { success: true }
}

export const getCurrentPersonnel = () => {
  try {
    const cached = localStorage.getItem('netra_personnel')
    if (cached) return JSON.parse(cached)
  } catch (err) {
    // Ignore JSON error
  }
  return {
    org_id: 'NETRA-HQ-01',
    full_name: 'Command Officer',
    role: 'Command Director',
    badge_id: 'BADGE-901',
  }
}

export const logoutPersonnel = async () => {
  localStorage.removeItem('netra_personnel')
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[API] signOut error:', err.message)
    }
  }
}

// ─── Traffic & Analytics ──────────────────────────────────────────────────────

export const getTrafficData = async () => {
  await delay()
  return { data: mockTrafficData }
}

export const getAnalyticsData = async () => {
  await delay()
  return { data: mockAnalyticsData }
}

// ─── Traffic Prevention & Control APIs ────────────────────────────────────────

import { PRIMARY_INCIDENT, getPreventionKPIs, evaluateCongestionRule } from './trafficPreventionEngine'

let activeIncidentState = { ...PRIMARY_INCIDENT }

export const getPreventionStatus = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('traffic_incidents').select('*').limit(1).maybeSingle()
      if (!error && data) {
        return { data: { ...activeIncidentState, status: data.status || activeIncidentState.status }, kpis: getPreventionKPIs(data.status) }
      }
    } catch (err) {
      console.warn('[API] getPreventionStatus error, using engine fallback:', err.message)
    }
  }
  await delay(120)
  return { 
    data: activeIncidentState, 
    kpis: getPreventionKPIs(activeIncidentState.status) 
  }
}

export const getPreventionIncidents = async () => {
  await delay(100)
  return { data: [activeIncidentState], total: 1 }
}

export const getPreventionRecommendations = async () => {
  await delay(100)
  return { 
    data: activeIncidentState.analysis.recommendedActions,
    decisionPoints: activeIncidentState.analysis.decisionPoints,
    severity: activeIncidentState.severity,
  }
}

export const getPreventionSignals = async () => {
  await delay(100)
  return { data: activeIncidentState.signalPlan }
}

export const getPreventionRoutes = async () => {
  await delay(100)
  return { data: activeIncidentState.routePlan }
}

export const approvePreventionAction = async (incidentId = activeIncidentState.id) => {
  activeIncidentState = { ...activeIncidentState, status: 'APPROVED' }
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('traffic_incidents').upsert({ id: incidentId, status: 'APPROVED' })
    } catch (err) {
      console.warn('[API] approvePreventionAction error:', err.message)
    }
  }
  await delay(150)
  return { success: true, status: 'APPROVED', incident: activeIncidentState }
}

export const rejectPreventionAction = async (incidentId = activeIncidentState.id) => {
  activeIncidentState = { ...activeIncidentState, status: 'REJECTED' }
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('traffic_incidents').upsert({ id: incidentId, status: 'REJECTED' })
    } catch (err) {
      console.warn('[API] rejectPreventionAction error:', err.message)
    }
  }
  await delay(150)
  return { success: true, status: 'REJECTED', incident: activeIncidentState }
}

export const executePreventionPlan = async (incidentId = activeIncidentState.id) => {
  activeIncidentState = { ...activeIncidentState, status: 'EXECUTED' }
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('traffic_incidents').upsert({ id: incidentId, status: 'EXECUTED' })
    } catch (err) {
      console.warn('[API] executePreventionPlan error:', err.message)
    }
  }
  await delay(200)
  return { success: true, status: 'EXECUTED', incident: activeIncidentState }
}

export const resetPreventionSimulation = async () => {
  activeIncidentState = { ...PRIMARY_INCIDENT, status: 'PENDING_APPROVAL' }
  await delay(100)
  return { success: true, incident: activeIncidentState }
}

