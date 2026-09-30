/**
 * services/trafficPreventionEngine.js
 *
 * NETRA Real-Time Traffic Prevention & Predictive Traffic Control Engine
 * City-Wide Multi-Camera ANPR Trajectory Tracking & Urban Traffic Analytics
 *
 * Core Capabilities:
 * - Network-wide camera telemetry (CAM-001 to CAM-012)
 * - Real-time vehicle influx/outflux, density, and congestion metrics
 * - Explainable multi-camera congestion prediction ("Critical in X minutes", confidence score, cause)
 * - 10-minute projection timeline and actual vs. predicted curves
 * - Data-driven traffic signal timing optimization (North-South vs. East-West)
 * - Prediction-aware alternate route diversions
 * - 8-Phase Master Simulation Pipeline with Before / After Simulated Impact
 */

import { 
  cameras as rawCameras, 
  trafficHeatmapData as rawHeatmap, 
  congestionZonesData as rawCongestionZones,
  trajectories as rawTrajectories 
} from '../data/mockData'
import { getTrafficPreventionRoadRoutes } from './roadRoutingService'

// ─── Network Cameras Telemetry & Prediction Model ────────────────────────────
export const NETWORK_CAMERAS = [
  {
    id: 'CAM-001',
    name: 'Bandra-Worli Sea Link Toll',
    junction: 'Sea Link South Intermodal',
    zone: 'Mumbai West',
    lat: 19.0270,
    lng: 72.8180,
    currentVehicles: 42,
    inflow: 14, // veh/min
    outflow: 12,
    avgSpeed: 38, // km/h
    density: 'MEDIUM',
    congestion: 'MODERATE',
    currentGreen: 30,
    aiGreen: 38,
    delta: 8,
    prediction: {
      status: 'NORMAL',
      level: 'NORMAL',
      text: 'Normal for next 10 min',
      minutes: null,
      predictedVehicles: 48,
      predictedSpeed: 36,
      confidence: 94,
      cause: 'Steady corridor flow, toll capacity balanced',
      prevention: 'Routine signal timing adjustment (+8s)',
    },
    action: 'MONITOR',
  },
  {
    id: 'CAM-002',
    name: 'Sion Circle Junction',
    junction: 'Sion Central Flyover Bypass',
    zone: 'Central Corridor',
    lat: 19.0390,
    lng: 72.8619,
    currentVehicles: 87,
    inflow: 22,
    outflow: 18,
    avgSpeed: 19,
    density: 'HIGH',
    congestion: 'HEAVY',
    currentGreen: 30,
    aiGreen: 45,
    delta: 15,
    prediction: {
      status: 'POSSIBLE',
      level: 'HEAVY',
      text: 'Heavy traffic in 8 min',
      minutes: 8,
      predictedVehicles: 104,
      predictedSpeed: 15,
      confidence: 82,
      cause: 'Incoming feeder congestion from Dharavi connector',
      prevention: 'Signal green extension (+15s) and alternate bypass',
    },
    action: 'OPTIMIZE',
  },
  {
    id: 'CAM-003',
    name: 'Vashi Bridge Toll Plaza',
    junction: 'Junction A / Intermodal',
    zone: 'Navi Mumbai Entry',
    lat: 19.0620,
    lng: 72.9850,
    currentVehicles: 127,
    inflow: 28,
    outflow: 11,
    avgSpeed: 11,
    density: 'VERY HIGH',
    congestion: 'CRITICAL',
    currentGreen: 30,
    aiGreen: 50,
    delta: 20,
    prediction: {
      status: 'EXPECTED',
      level: 'CRITICAL',
      text: 'Critical congestion expected in 7 min',
      minutes: 7,
      predictedVehicles: 145,
      predictedSpeed: 9,
      confidence: 87,
      cause: 'Increasing inflow (28/min) + incoming trajectory traffic from CAM-001/CAM-002',
      prevention: 'Signal Optimization (30s → 50s) + Alternate Route Diversion via CAM-002',
    },
    action: 'URGENT',
  },
  {
    id: 'CAM-004',
    name: 'Palm Beach Road Sector-19',
    junction: 'Sector-19 Signal Grid',
    zone: 'Navi Mumbai South',
    lat: 19.0195,
    lng: 73.0200,
    currentVehicles: 21,
    inflow: 6,
    outflow: 7,
    avgSpeed: 44,
    density: 'LOW',
    congestion: 'NORMAL',
    currentGreen: 30,
    aiGreen: 25,
    delta: -5,
    prediction: {
      status: 'NORMAL',
      level: 'NORMAL',
      text: 'No congestion expected',
      minutes: null,
      predictedVehicles: 24,
      predictedSpeed: 42,
      confidence: 96,
      cause: 'Free flow conditions on dual carriageway',
      prevention: 'No intervention required',
    },
    action: 'NO ACTION',
  },
  {
    id: 'CAM-005',
    name: 'Eastern Freeway Chembur Exit',
    junction: 'Chembur Freeway Concourse',
    zone: 'Mumbai East',
    lat: 19.0550,
    lng: 72.8880,
    currentVehicles: 64,
    inflow: 19,
    outflow: 16,
    avgSpeed: 31,
    density: 'MEDIUM',
    congestion: 'MODERATE',
    currentGreen: 30,
    aiGreen: 35,
    delta: 5,
    prediction: {
      status: 'NORMAL',
      level: 'MODERATE',
      text: 'Moderate flow for next 10 min',
      minutes: null,
      predictedVehicles: 68,
      predictedSpeed: 29,
      confidence: 90,
      cause: 'Slight ramp slowdown during peak commute',
      prevention: 'Ramp metering advisory active',
    },
    action: 'MONITOR',
  },
  {
    id: 'CAM-006',
    name: 'Marine Drive Promenade',
    junction: 'Nariman Point Link',
    zone: 'South Mumbai',
    lat: 18.9430,
    lng: 72.8230,
    currentVehicles: 35,
    inflow: 10,
    outflow: 12,
    avgSpeed: 41,
    density: 'LOW',
    congestion: 'NORMAL',
    currentGreen: 30,
    aiGreen: 30,
    delta: 0,
    prediction: {
      status: 'NORMAL',
      level: 'NORMAL',
      text: 'Normal flow expected',
      minutes: null,
      predictedVehicles: 38,
      predictedSpeed: 40,
      confidence: 93,
      cause: 'Synchronized green wave operational',
      prevention: 'Maintain baseline green schedule',
    },
    action: 'NO ACTION',
  },
  {
    id: 'CAM-007',
    name: 'Thane Majiwada Flyover',
    junction: 'Ghodbunder Jn Hub',
    zone: 'Thane Corridor',
    lat: 19.2183,
    lng: 72.9781,
    currentVehicles: 98,
    inflow: 25,
    outflow: 14,
    avgSpeed: 16,
    density: 'HIGH',
    congestion: 'HEAVY',
    currentGreen: 35,
    aiGreen: 52,
    delta: 17,
    prediction: {
      status: 'LIKELY',
      level: 'HEAVY',
      text: 'Heavy traffic expected in 6 min',
      minutes: 6,
      predictedVehicles: 122,
      predictedSpeed: 12,
      confidence: 79,
      cause: 'Freight merge from Nashik Highway into urban distributor',
      prevention: 'Signal extension (+17s) & Eastward bypass guidance',
    },
    action: 'OPTIMIZE',
  },
  {
    id: 'CAM-008',
    name: 'Kurla CST Road Junction',
    junction: 'BKC East Gateway',
    zone: 'Central Mumbai',
    lat: 19.0688,
    lng: 72.8752,
    currentVehicles: 55,
    inflow: 16,
    outflow: 15,
    avgSpeed: 27,
    density: 'MEDIUM',
    congestion: 'MODERATE',
    currentGreen: 30,
    aiGreen: 36,
    delta: 6,
    prediction: {
      status: 'POSSIBLE',
      level: 'MODERATE',
      text: 'Possible minor delay in 12 min',
      minutes: 12,
      predictedVehicles: 66,
      predictedSpeed: 24,
      confidence: 74,
      cause: 'Commercial delivery unloading on curb lane',
      prevention: 'Active lane clearance advisory',
    },
    action: 'MONITOR',
  },
  {
    id: 'CAM-009',
    name: 'Andheri WEH Flyover',
    junction: 'Western Express Highway Jn',
    zone: 'Mumbai Suburbs',
    lat: 19.1197,
    lng: 72.8464,
    currentVehicles: 84,
    inflow: 20,
    outflow: 17,
    avgSpeed: 23,
    density: 'HIGH',
    congestion: 'MODERATE',
    currentGreen: 30,
    aiGreen: 40,
    delta: 10,
    prediction: {
      status: 'POSSIBLE',
      level: 'MODERATE',
      text: 'Congestion possible in 9 min',
      minutes: 9,
      predictedVehicles: 99,
      predictedSpeed: 18,
      confidence: 81,
      cause: 'Airport approach traffic converging with highway flow',
      prevention: 'Adaptive phase extension on Southbound slip road',
    },
    action: 'OPTIMIZE',
  },
  {
    id: 'CAM-010',
    name: 'Turbhe Naka Midc',
    junction: 'Turbhe Industrial Jn',
    zone: 'Navi Mumbai Hub',
    lat: 19.0725,
    lng: 73.0135,
    currentVehicles: 73,
    inflow: 18,
    outflow: 16,
    avgSpeed: 25,
    density: 'MEDIUM',
    congestion: 'MODERATE',
    currentGreen: 30,
    aiGreen: 34,
    delta: 4,
    prediction: {
      status: 'NORMAL',
      level: 'MODERATE',
      text: 'Moderate flow for next 10 min',
      minutes: null,
      predictedVehicles: 78,
      predictedSpeed: 23,
      confidence: 88,
      cause: 'Commercial vehicle influx stable',
      prevention: 'Routine signal synchronization',
    },
    action: 'MONITOR',
  },
  {
    id: 'CAM-011',
    name: 'Mulund Check Naka Toll',
    junction: 'Eastern Express Gateway',
    zone: 'North Mumbai',
    lat: 19.1765,
    lng: 72.9567,
    currentVehicles: 62,
    inflow: 21,
    outflow: 15,
    avgSpeed: 26,
    density: 'MEDIUM',
    congestion: 'MODERATE',
    currentGreen: 30,
    aiGreen: 42,
    delta: 12,
    prediction: {
      status: 'POSSIBLE',
      level: 'MODERATE',
      text: 'Moderate congestion possible in 10 min',
      minutes: 10,
      predictedVehicles: 85,
      predictedSpeed: 19,
      confidence: 68,
      cause: 'Border toll plaza deceleration wave propagating backwards',
      prevention: 'Electronic toll boom auto-open override',
    },
    action: 'OPTIMIZE',
  },
  {
    id: 'CAM-012',
    name: 'Dadar TT Circle',
    junction: 'Dr. Ambedkar Road Crossing',
    zone: 'South-Central Mumbai',
    lat: 19.0178,
    lng: 72.8478,
    currentVehicles: 49,
    inflow: 12,
    outflow: 13,
    avgSpeed: 33,
    density: 'LOW',
    congestion: 'NORMAL',
    currentGreen: 30,
    aiGreen: 30,
    delta: 0,
    prediction: {
      status: 'NORMAL',
      level: 'NORMAL',
      text: 'No congestion expected',
      minutes: null,
      predictedVehicles: 51,
      predictedSpeed: 32,
      confidence: 95,
      cause: 'Optimal signal cycle progression',
      prevention: 'No intervention required',
    },
    action: 'NO ACTION',
  },
]

// ─── Core Prevention Incident & Corridor Modeling (Primary Target: CAM-003) ───
export const PRIMARY_INCIDENT = {
  id: 'INC-TRF-9021',
  timestamp: new Date().toISOString(),
  corridor: 'Vashi Bridge Toll & Central Link (CAM-003 Corridor)',
  affectedCameraId: 'CAM-003',
  affectedCameraName: 'Vashi Bridge Toll Plaza',
  junction: 'Junction A / Intermodal',
  zone: 'Navi Mumbai Entry / Sion-Panvel Corridor',
  location: { lat: 19.0620, lng: 72.9850 },
  severity: 'CRITICAL',
  status: 'PENDING', // PENDING, APPROVED, EXECUTING, EXECUTED, REJECTED
  
  // Baseline Pre-Intervention Telemetry
  before: {
    vehicleCount: 127,
    avgSpeed: 11, // km/h
    congestionLevel: 'CRITICAL',
    congestionIndex: 92, // %
    queueLengthMeters: 420,
    queueStatus: 'SEVERE',
    northSouthCount: 127,
    eastWestCount: 42,
    northSouthSpeed: 11,
    eastWestSpeed: 29,
    imbalanceRatio: '3.02 : 1',
    travelTimeMinutes: 12,
    predictedVehiclesIn10Min: 145,
  },

  // Simulated Post-Intervention Telemetry
  after: {
    vehicleCount: 82, // -35%
    avgSpeed: 22, // km/h (+100%)
    congestionLevel: 'MODERATE',
    congestionIndex: 54, // % (-38 pts)
    queueLengthMeters: 110, // -74%
    queueStatus: 'REDUCED',
    northSouthCount: 82,
    eastWestCount: 58,
    northSouthSpeed: 22,
    eastWestSpeed: 26,
    imbalanceRatio: '1.41 : 1',
    travelTimeMinutes: 7, // -5 min
    congestionReductionPercent: 35,
    speedImprovementPercent: 100,
    timeSavedMinutes: 5,
  },

  // Explainable Prediction Model
  prediction: {
    title: 'Critical Congestion Expected',
    status: 'EXPECTED',
    expectedInMinutes: 8,
    currentVehicles: 87, // Baseline before buildup
    predictedVehicles: 132,
    vehicleChange: '+45 vehicles',
    currentSpeed: 19,
    predictedSpeed: 10,
    confidence: 87,
    predictedLevel: 'CRITICAL',
    cause: 'Increasing inflow (28/min) + incoming trajectory traffic from CAM-002 and CAM-001',
    prevention: 'Signal Timing (+20s Green) + AI Alternate Route via Sion Circle (CAM-002)',
  },

  // Signal Plans (North-South vs East-West)
  signalPlan: {
    junction: 'Junction A / CAM-003 Intermodal',
    cycleTimeSeconds: 60,
    current: {
      northSouth: { greenSeconds: 30, redSeconds: 30, state: 'GREEN', vehicles: 127, speed: 11 },
      eastWest: { greenSeconds: 30, redSeconds: 30, state: 'RED', vehicles: 42, speed: 29 },
    },
    proposed: {
      northSouth: { greenSeconds: 50, redSeconds: 10, delta: 20, state: 'GREEN', vehicles: 145, targetSpeed: 22 },
      eastWest: { greenSeconds: 10, redSeconds: 50, delta: -20, state: 'RED', vehicles: 42, targetSpeed: 26 },
    },
    whyDecision: {
      northSouthVehicles: 127,
      eastWestVehicles: 42,
      northSouthSpeed: '11 km/h',
      eastWestSpeed: '29 km/h',
      predictedNorthSouthVehicles: 145,
      decisionText: 'Traffic demand on North-South is significantly higher (+202%).',
      recommendationText: 'North-South green extended 30s → 50s (+20 sec). East-West green adjusted 30s → 10s (-20 sec).',
      expectedPurpose: 'Allow more vehicles to clear the congested corridor before severe gridlock occurs.',
    },
  },

  // Alternate Route Plan (Turn-by-Turn Road Network Routes)
  routePlan: {
    originCamera: 'CAM-001',
    originName: 'Bandra-Worli Sea Link Toll',
    destinationCamera: 'CAM-005',
    destinationName: 'Eastern Freeway Chembur Exit',
    
    currentRoute: {
      name: 'Current Congested Corridor (Route A)',
      corridorPath: ['CAM-001', 'CAM-003', 'CAM-005'],
      distanceKm: 34.1,
      travelTimeMinutes: 12,
      predictedTravelTimeMinutes: 15,
      riskLevel: 'Critical Risk',
      avgSpeedKmH: 11,
      status: 'CRITICAL',
      statusColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.4)',
      lineDash: '8, 6',
      // High-Fidelity Road Network Geometry (632 turn-by-turn points via Vashi Bridge)
      coordinates: getTrafficPreventionRoadRoutes().currentRoute.coordinates,
    },

    alternateRoute: {
      name: 'AI Recommended Alternate Route (Route B)',
      corridorPath: ['CAM-001', 'CAM-002', 'CAM-005'],
      distanceKm: 13.0,
      travelTimeMinutes: 7,
      predictedTravelTimeMinutes: 8,
      riskLevel: 'Moderate Flow',
      avgSpeedKmH: 28,
      status: 'MODERATE',
      statusColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      timeSavedMinutes: 5,
      percentFaster: 42,
      // High-Fidelity Road Network Geometry (389 turn-by-turn points via Sion Circle Bypass)
      coordinates: getTrafficPreventionRoadRoutes().alternateRoute.coordinates,
    },
  },
}

// ─── Upcoming Traffic Risks List (Section 24) ────────────────────────────────
export const UPCOMING_TRAFFIC_RISKS = [
  {
    id: 'RISK-01',
    cameraId: 'CAM-003',
    cameraName: 'Vashi Bridge Toll Plaza',
    level: 'CRITICAL',
    title: 'Critical congestion expected in 8 min',
    confidence: 87,
    currentVehicles: 127,
    predictedVehicles: 145,
    speed: 11,
    tone: 'rose',
    minutes: 8,
  },
  {
    id: 'RISK-02',
    cameraId: 'CAM-007',
    cameraName: 'Thane Majiwada Flyover',
    level: 'HEAVY',
    title: 'Heavy traffic expected in 6 min',
    confidence: 79,
    currentVehicles: 98,
    predictedVehicles: 122,
    speed: 16,
    tone: 'orange',
    minutes: 6,
  },
  {
    id: 'RISK-03',
    cameraId: 'CAM-011',
    cameraName: 'Mulund Check Naka Toll',
    level: 'MODERATE',
    title: 'Moderate congestion possible in 10 min',
    confidence: 68,
    currentVehicles: 62,
    predictedVehicles: 85,
    speed: 26,
    tone: 'amber',
    minutes: 10,
  },
]

// ─── Next 10 Minutes Visual Timeline Events (Section 11) ──────────────────────
export const NEXT_10_MINUTES_TIMELINE = [
  {
    minute: 0,
    label: 'NOW',
    cameraId: 'CAM-001',
    status: 'NORMAL',
    color: '#10b981',
    message: 'Baseline network scan: 48 active cameras streaming telemetry',
  },
  {
    minute: 2,
    label: '2 min',
    cameraId: 'CAM-009',
    status: 'MODERATE',
    color: '#eab308',
    message: 'Density surge detected approaching Andheri Western Express Highway',
  },
  {
    minute: 5,
    label: '5 min',
    cameraId: 'CAM-007',
    status: 'HEAVY',
    color: '#f97316',
    message: '🟠 CAM-007: Majiwada flyover speed falling below 15 km/h threshold',
  },
  {
    minute: 7,
    label: '7 min',
    cameraId: 'CAM-003',
    status: 'CRITICAL',
    color: '#f43f5e',
    message: '🔴 CAM-003: Critical bottleneck expected at Junction A (132+ veh)',
  },
  {
    minute: 8,
    label: '8 min',
    cameraId: 'CAM-007',
    status: 'HEAVY',
    color: '#f97316',
    message: '🟠 CAM-007: Heavy freight queue extending 280m into Ghodbunder merge',
  },
  {
    minute: 10,
    label: '10 min',
    cameraId: 'CAM-011',
    status: 'MODERATE',
    color: '#eab308',
    message: '🟡 CAM-011: Possible moderate toll slowdown at Mulund Check Naka',
  },
]

// ─── Prediction Graph Generator (Section 31: Actual vs Predicted) ───────────
export function getCameraPredictionCurve(camera) {
  const current = camera.currentVehicles || 87
  const predicted = camera.prediction?.predictedVehicles || Math.round(current * 1.3)
  const isRising = predicted > current
  
  // Historical Actuals (-4m, -2m, NOW)
  const actual = [
    { time: '-4m', count: Math.max(10, Math.round(current * (isRising ? 0.72 : 1.15))), type: 'ACTUAL' },
    { time: '-2m', count: Math.max(12, Math.round(current * (isRising ? 0.86 : 1.08))), type: 'ACTUAL' },
    { time: 'NOW', count: current, type: 'ACTUAL' },
  ]

  // Projections (+2m, +4m, +6m, +8m, +10m)
  const step = (predicted - current) / 5
  const projected = [
    { time: '+2m', count: Math.round(current + step * 1), type: 'PREDICTED' },
    { time: '+4m', count: Math.round(current + step * 2), type: 'PREDICTED' },
    { time: '+6m', count: Math.round(current + step * 3), type: 'PREDICTED' },
    { time: '+8m', count: Math.round(current + step * 4), type: 'PREDICTED' },
    { time: '+10m', count: predicted, type: 'PREDICTED' },
  ]

  return [...actual, ...projected]
}

// ─── Real-Time Network Status KPI Generator (Section 2) ─────────────────────
export function getPreventionKPIs(cameras = NETWORK_CAMERAS, isExecuted = false) {
  const totalVehicles = cameras.reduce((sum, c) => sum + (c.currentVehicles || 0), 0)
  const criticalCount = cameras.filter(c => c.congestion === 'CRITICAL').length
  const predictedCriticalCount = cameras.filter(c => c.prediction?.status === 'EXPECTED' || c.prediction?.status === 'LIKELY').length

  return [
    {
      id: 'kpi-active-cameras',
      title: 'ACTIVE CAMERAS',
      value: '48 / 52',
      subtext: '48 Online · 4 Standby',
      tone: 'cyan',
      badge: '92.3% ONLINE',
    },
    {
      id: 'kpi-current-vehicles',
      title: 'CURRENT VEHICLES',
      value: totalVehicles.toLocaleString(),
      subtext: 'Live Network ANPR Feed',
      tone: 'emerald',
      badge: '● STREAMING',
    },
    {
      id: 'kpi-critical-zones',
      title: 'CRITICAL ZONES',
      value: isExecuted ? '01' : (criticalCount > 0 ? `0${criticalCount}` : '02'),
      subtext: isExecuted ? '1 Resolved via AI' : 'Immediate Risk Hotspots',
      tone: isExecuted ? 'emerald' : 'rose',
      badge: isExecuted ? 'IMPROVING' : 'URGENT',
    },
    {
      id: 'kpi-predicted-congestion',
      title: 'PREDICTED CONGESTION',
      value: isExecuted ? '01' : (predictedCriticalCount > 0 ? `0${predictedCriticalCount}` : '03'),
      subtext: 'In Next 10 Minutes',
      tone: isExecuted ? 'amber' : 'orange',
      badge: isExecuted ? 'DIVERSION ACTIVE' : 'PREDICTION ON',
    },
    {
      id: 'kpi-signal-optimizations',
      title: 'SIGNAL OPTIMIZATIONS',
      value: isExecuted ? '07' : '06',
      subtext: 'Simulated Controller Grid',
      tone: 'cyan',
      badge: isExecuted ? '+1 ACTIVE' : 'PREPARED',
    },
    {
      id: 'kpi-alternate-routes',
      title: 'ALTERNATE ROUTES',
      value: '03',
      subtext: '5 min Avg Time Saved',
      tone: 'emerald',
      badge: 'ACTIVE BYPASS',
    },
  ]
}

// ─── Decision Rule Engine (Section 32) ──────────────────────────────────────
export function evaluateCongestionRule({ congestionIndex = 85, flowImbalance = 2.5, avgSpeed = 15 } = {}) {
  if (congestionIndex >= 85 || flowImbalance >= 2.5 || avgSpeed <= 15) {
    return {
      severity: 'CRITICAL',
      interventionTier: 4,
      actions: [
        'SIGNAL_TIMING_OPTIMIZATION',
        'ALTERNATE_ROUTE_RECOMMENDATION',
        'TRAFFIC_DIVERSION',
        'ADMIN_ALERT'
      ],
      description: 'Critical congestion with severe corridor imbalance. Immediate dual intervention recommended.'
    }
  }
  if (congestionIndex >= 70 || avgSpeed <= 25) {
    return {
      severity: 'HEAVY',
      interventionTier: 3,
      actions: ['SIGNAL_TIMING_OPTIMIZATION', 'ALTERNATE_ROUTE_RECOMMENDATION'],
      description: 'Heavy traffic volume. Signal rebalancing and alternative corridor recommended.'
    }
  }
  if (congestionIndex >= 50) {
    return {
      severity: 'MODERATE',
      interventionTier: 2,
      actions: ['MONITOR', 'ALTERNATE_ROUTE_RECOMMENDATION'],
      description: 'Steady traffic flow. Advisory routing active.'
    }
  }
  return {
    severity: 'NORMAL',
    interventionTier: 1,
    actions: ['MONITOR'],
    description: 'Free flow conditions across network. No proactive intervention required.'
  }
}

export const SIMULATION_PHASES = [
  {
    phase: 1,
    key: 'ANALYZING_LIVE_TRAFFIC',
    title: 'Phase 1: Analyzing Live Traffic...',
    message: 'Ingesting multi-camera telemetry, vehicle velocities, heatmap densities, and ANPR trajectories...',
    progress: 12,
    checks: [
      '✓ Cameras analyzed (48 active feeds)',
      '✓ Vehicle counts analyzed (1,480+ detected)',
      '✓ Heatmap analyzed (thermal index 92% at Vashi)',
      '✓ Trajectories analyzed across CAM-001 → CAM-003 corridor'
    ],
  },
  {
    phase: 2,
    key: 'DETECTING_TRAFFIC_RISK',
    title: 'Phase 2: Detecting Traffic Risk...',
    message: 'CAM-003 has increasing congestion risk: 127 vehicles detected, crawl speed 11 km/h.',
    progress: 25,
    checks: [
      'Inflow rate (28/min) exceeds discharge capability (11/min)',
      'Corridor flow imbalance ratio reached 3.02 : 1',
      'Queue extending 420 meters towards intermodal toll'
    ],
  },
  {
    phase: 3,
    key: 'PREDICTING_FUTURE_TRAFFIC',
    title: 'Phase 3: Predicting Future Traffic...',
    message: 'Critical congestion expected in approximately 7–8 minutes (Confidence: 87%).',
    progress: 40,
    checks: [
      'Projected vehicle count in 10 min: 145 vehicles (+45 veh)',
      'Projected corridor velocity drop: 19 km/h → 9 km/h',
      'High confidence risk flagged on GIS map overlay'
    ],
  },
  {
    phase: 4,
    key: 'GENERATING_STRATEGY',
    title: 'Phase 4: Generating Prevention Strategy...',
    message: 'Signal optimization plan synthesized and alternate bypass route identified.',
    progress: 55,
    checks: [
      '✓ Signal optimization: North-South green extension (+20s)',
      '✓ Alternate route identified: CAM-001 → CAM-002 → CAM-005 bypass',
      '✓ Estimated travel time savings: 5 minutes (42% faster)'
    ],
  },
  {
    phase: 5,
    key: 'SHOW_PLANS_AND_ROUTE',
    title: 'Phase 5: Signal & Bypass Plan Ready',
    message: 'Current Signal: 30s/30s vs AI Signal: 50s/10s. Alternate route mapped on GIS display.',
    progress: 70,
    checks: [
      'Current Signal Plan: NS 30s / EW 30s',
      'AI Recommended Plan: NS 50s (+20s) / EW 10s (-20s)',
      'Red Line (Congested Route) & Green Line (AI Bypass) drawn on map'
    ],
  },
  {
    phase: 6,
    key: 'AWAITING_ADMIN_APPROVAL',
    title: 'Phase 6: Awaiting Administrator Approval',
    message: 'Review proposed signal timing changes and corridor bypass route. Click APPROVE to execute simulation.',
    progress: 82,
    checks: [
      'Awaiting administrator approval',
      'Simulated execution will not affect live field infrastructure',
      'Click [ APPROVE ] to initiate actuation simulation'
    ],
  },
  {
    phase: 7,
    key: 'EXECUTING_PREVENTION_PLAN',
    title: 'Phase 7: Executing Prevention Plan...',
    message: 'Actuating signal controller, animating green cycles, and activating diversion route...',
    progress: 94,
    checks: [
      'Applying NS 50s green phase in simulation model',
      'Traffic diversion active on GIS map display',
      'Vehicles dispersing via Sion Circle (CAM-002) bypass'
    ],
  },
  {
    phase: 8,
    key: 'PREVENTION_PLAN_EXECUTED',
    title: 'Phase 8: ✓ Prevention Plan Executed',
    message: 'Simulated result active: Congestion reduced by 35%. Average speed elevated to 22 km/h.',
    progress: 100,
    checks: [
      '✓ Prevention plan successfully simulated',
      '✓ Queue cleared by 74% (420m → 110m)',
      '✓ Travel time reduced from 12 min to 7 min (5 min saved)'
    ],
  },
]
