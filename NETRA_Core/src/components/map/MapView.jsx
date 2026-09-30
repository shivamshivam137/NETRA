import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cameras as mockCameras } from '../../data/mockData'
import { 
  Camera, 
  Layers, 
  Crosshair, 
  Video, 
  Activity, 
  Car, 
  ShieldCheck, 
  AlertTriangle, 
  Radio
} from 'lucide-react'
import { getCompleteRoadTrajectory } from '../../services/roadRoutingService'

// ─── Custom Leaflet Marker Icons ─────────────────────────────────────────────
const createCameraIcon = (status) => {
  let colorClass = 'bg-emerald-500 border-emerald-300 text-emerald-300 shadow-emerald-500/50'
  let ringPulse = 'bg-emerald-400'
  let isOffline = false

  if (status === 'warning') {
    colorClass = 'bg-amber-500 border-amber-300 text-amber-300 shadow-amber-500/50'
    ringPulse = 'bg-amber-400'
  } else if (status === 'offline') {
    colorClass = 'bg-rose-500 border-rose-300 text-rose-300 shadow-rose-500/50'
    ringPulse = 'bg-rose-400'
    isOffline = true
  }

  return L.divIcon({
    className: 'custom-leaflet-camera-marker',
    html: `
      <div class="relative flex items-center justify-center group cursor-pointer">
        ${!isOffline ? `
          <span class="absolute -inset-1 rounded-full ${ringPulse} opacity-40 animate-ping"></span>
        ` : ''}
        <div class="relative w-8 h-8 rounded-full ${colorClass} border-2 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-115">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
            <rect x="2" y="6" width="14" height="12" rx="2"/>
          </svg>
        </div>
        <div class="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// ─── Trajectory Sequence Marker Icon ─────────────────────────────────────────
const createTrajectorySequenceIcon = (sequence, isFirst, isLast) => {
  let badgeBg = 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-cyan-500/60'
  
  if (isFirst) {
    badgeBg = 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-emerald-500/60'
  } else if (isLast) {
    badgeBg = 'bg-amber-400 border-amber-200 text-slate-950 shadow-amber-400/60'
  }

  return L.divIcon({
    className: 'custom-leaflet-trajectory-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer group">
        <span class="absolute -inset-1 rounded-full bg-cyan-400 opacity-40 animate-ping"></span>
        <div class="relative w-7 h-7 rounded-full ${badgeBg} border-2 flex items-center justify-center shadow-lg font-mono font-black text-xs transition-transform duration-200 group-hover:scale-125">
          ${sequence}
        </div>
        <div class="w-1.5 h-2 bg-white/80 rounded-b-sm shadow-sm"></div>
      </div>
    `,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
  })
}

// ─── Recenter / Auto-Fit Controller Subcomponent ─────────────────────────────
function MapController({ center, zoom, triggerRecenter, selectedTrajectory, roadCoordinates = [] }) {
  const map = useMap()

  // Auto-fit bounds whenever selectedTrajectory or roadCoordinates is supplied or changed
  useEffect(() => {
    const coordsToFit = (roadCoordinates && roadCoordinates.length > 0)
      ? roadCoordinates
      : (selectedTrajectory?.points?.map(p => [
          p.lat !== undefined ? p.lat : p.latitude,
          p.lng !== undefined ? p.lng : p.longitude
        ]) || [])

    if (coordsToFit.length > 0) {
      const bounds = L.latLngBounds(coordsToFit)
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.0 })
      }
    }
  }, [selectedTrajectory, roadCoordinates, map])

  // Recenter trigger
  useEffect(() => {
    if (triggerRecenter > 0) {
      const coordsToFit = (roadCoordinates && roadCoordinates.length > 0)
        ? roadCoordinates
        : (selectedTrajectory?.points?.map(p => [
            p.lat !== undefined ? p.lat : p.latitude,
            p.lng !== undefined ? p.lng : p.longitude
          ]) || [])

      if (coordsToFit.length > 0) {
        const bounds = L.latLngBounds(coordsToFit)
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.0 })
        }
      } else {
        map.flyTo(center, zoom, { duration: 1.2 })
      }
    }
  }, [triggerRecenter, map, center, zoom, selectedTrajectory, roadCoordinates])

  return null
}

export default function MapView({ 
  cameras = mockCameras, 
  selectedTrajectory = null,
  fullHeight = false 
}) {
  // Center coordinates for Mumbai / Navi Mumbai
  const defaultCenter = useMemo(() => [19.0400, 72.9100], [])
  const defaultZoom = 11

  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'warning', 'offline'
  const [recenterCount, setRecenterCount] = useState(0)

  // Turn-by-turn road geometry for selected vehicle trajectory (Road-Wise Trajectory)
  const [resolvedRoadCoords, setResolvedRoadCoords] = useState([])

  // Resolve road-following coordinates when selectedTrajectory changes
  useEffect(() => {
    let isMounted = true
    if (!selectedTrajectory || !selectedTrajectory.points || selectedTrajectory.points.length < 2) {
      setResolvedRoadCoords([])
      return
    }

    // 1. If precomputed road coordinates are already provided, use them immediately (0ms)
    if (selectedTrajectory.roadCoordinates && selectedTrajectory.roadCoordinates.length > 0) {
      setResolvedRoadCoords(selectedTrajectory.roadCoordinates)
      return
    }

    // 2. Otherwise asynchronously query road network routing engine
    getCompleteRoadTrajectory(selectedTrajectory.points).then((res) => {
      if (isMounted && res && res.coordinates && res.coordinates.length > 0) {
        setResolvedRoadCoords(res.coordinates)
      }
    })

    return () => {
      isMounted = false
    }
  }, [selectedTrajectory])

  // Filtered cameras based on user tab selection
  const filteredCameras = useMemo(() => {
    if (statusFilter === 'all') return cameras
    return cameras.filter(c => c.status === statusFilter)
  }, [cameras, statusFilter])

  // Marker icons cached by status
  const markerIcons = useMemo(() => ({
    active: createCameraIcon('active'),
    warning: createCameraIcon('warning'),
    offline: createCameraIcon('offline'),
  }), [])

  // Camera statistics
  const activeCount = cameras.filter((c) => c.status === 'active').length
  const warningCount = cameras.filter((c) => c.status === 'warning').length
  const offlineCount = cameras.filter((c) => c.status === 'offline').length

  const heightClass = fullHeight ? 'h-[calc(100vh-180px)] min-h-[520px]' : 'h-[480px] sm:h-[540px]'

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-800/90 bg-[#070d1a] shadow-2xl flex flex-col`}>
      {/* ── Structured Top Header Bar (Non-overlapping) ── */}
      <div className="h-13 bg-[#091022] border-b border-slate-800/90 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 z-20 flex-shrink-0">
        {/* Left: GIS Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-white uppercase font-mono">
              GIS Surveillance Grid
            </span>
          </div>
          {selectedTrajectory ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded font-mono border border-cyan-500/30">
              <Car size={12} className="text-cyan-400" />
              <span>Route: {selectedTrajectory.plate} ({selectedTrajectory.points?.length || 0} Nodes)</span>
            </span>
          ) : (
            <span className="hidden md:inline-block text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-500/20">
              Mumbai MMR · EPSG:4326
            </span>
          )}
        </div>

        {/* Right: Quick Filter Tabs & Recenter Button */}
        <div className="flex items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-[#060a14] p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({cameras.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                statusFilter === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Online ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                statusFilter === 'warning' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Warning ({warningCount})
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                statusFilter === 'offline' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Offline ({offlineCount})
            </button>
          </div>

          {/* Recenter Button */}
          <button 
            title="Recenter Map / Fit Route" 
            onClick={() => setRecenterCount(c => c + 1)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-400 bg-[#060a14] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer font-mono font-medium shadow-sm"
          >
            <Crosshair size={13} />
            <span className="hidden sm:inline">Recenter</span>
          </button>
        </div>
      </div>

      {/* ── Interactive Leaflet Map Viewport ── */}
      <div className="flex-1 w-full h-full relative z-0 min-h-0">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', backgroundColor: '#070d1a' }}
        >
          <MapController 
            center={defaultCenter} 
            zoom={defaultZoom} 
            triggerRecenter={recenterCount} 
            selectedTrajectory={selectedTrajectory}
            roadCoordinates={resolvedRoadCoords}
          />

          {/* Clean Bottom-Right Zoom Controls */}
          <ZoomControl position="bottomright" />

          {/* OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Camera Markers */}
          {filteredCameras.map((cam) => {
            const statusKey = cam.status === 'active' ? 'active' : (cam.status === 'warning' ? 'warning' : 'offline')
            const icon = markerIcons[statusKey] || markerIcons.active

            return (
              <Marker
                key={cam.id}
                position={[cam.location.lat, cam.location.lng]}
                icon={icon}
              >
                <Popup className="netra-custom-popup">
                  <div className="p-3.5 bg-[#091022] text-slate-100 rounded-lg min-w-[240px] font-sans shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Video size={14} className="text-cyan-400" />
                        <span className="font-bold text-xs text-white font-mono">{cam.id}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                        cam.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : cam.status === 'warning'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {cam.status === 'active' ? 'Online' : cam.status === 'warning' ? 'Warning' : 'Offline'}
                      </span>
                    </div>

                    {/* Camera Name & Zone */}
                    <div className="mb-2">
                      <div className="text-xs font-bold text-white">{cam.name}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{cam.zone}</div>
                    </div>

                    {/* Telemetry Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                        <div className="text-slate-400 text-[10px] font-medium">Vehicles (24h)</div>
                        <div className="font-bold text-cyan-400 font-mono text-xs">
                          {cam.vehiclesDetected ? cam.vehiclesDetected.toLocaleString() : '1,420'}
                        </div>
                      </div>
                      <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                        <div className="text-slate-400 text-[10px] font-medium">Speed Limit</div>
                        <div className="font-bold text-emerald-400 font-mono text-xs">
                          {cam.speedLimit || 60} km/h
                        </div>
                      </div>
                    </div>

                    {/* Coords Footer */}
                    <div className="mt-2 text-[10px] text-slate-400 font-mono text-right flex justify-between items-center">
                      <span className="text-cyan-400/80">ANPR v4.2</span>
                      <span>{cam.location.lat.toFixed(4)}° N, {cam.location.lng.toFixed(4)}° E</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Road-Wise Trajectory Polyline (Follows actual road network) */}
          {resolvedRoadCoords && resolvedRoadCoords.length > 1 && (
            <>
              {/* Outer Cyan Glow Polyline */}
              <Polyline
                positions={resolvedRoadCoords}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 8,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Main Vector Trajectory Line */}
              <Polyline
                positions={resolvedRoadCoords}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 3.5,
                  dashArray: '8, 6',
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          )}

          {/* Trajectory Sequence Markers */}
          {selectedTrajectory && selectedTrajectory.points && selectedTrajectory.points.map((pt, idx) => {
            const isFirst = idx === 0
            const isLast = idx === selectedTrajectory.points.length - 1
            const icon = createTrajectorySequenceIcon(pt.sequence || idx + 1, isFirst, isLast)
            const lat = pt.lat !== undefined ? pt.lat : pt.latitude
            const lng = pt.lng !== undefined ? pt.lng : pt.longitude

            return (
              <Marker
                key={`traj-node-${pt.cameraId}-${idx}`}
                position={[lat, lng]}
                icon={icon}
                zIndexOffset={1000}
              >
                <Popup className="netra-custom-popup">
                  <div className="p-3.5 bg-[#091022] text-slate-100 rounded-lg min-w-[250px] font-sans shadow-2xl border border-cyan-500/30">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-full font-black text-[10px] font-mono flex items-center justify-center ${
                          isFirst ? 'bg-emerald-400 text-slate-950' : isLast ? 'bg-amber-400 text-slate-950' : 'bg-cyan-400 text-slate-950'
                        }`}>
                          #{pt.sequence || idx + 1}
                        </span>
                        <span className="font-bold text-xs text-white font-mono">{pt.cameraId}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${
                        isFirst ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        isLast ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        'bg-cyan-950 text-cyan-300 border-cyan-800'
                      }`}>
                        {isFirst ? 'Entry Point' : isLast ? 'Latest Fix' : `Node ${pt.sequence || idx + 1}`}
                      </span>
                    </div>

                    {/* License Plate & Location */}
                    <div className="mb-2 space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono">
                        License Plate: <strong className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{pt.plate || selectedTrajectory.plate}</strong>
                      </div>
                      <div className="text-xs font-semibold text-slate-200">
                        {pt.cameraName || `Surveillance Camera ${pt.cameraId}`}
                      </div>
                      {pt.cameraLocation && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {pt.cameraLocation}
                        </div>
                      )}
                    </div>

                    {/* Telemetry Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                      <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Timestamp</div>
                        <div className="font-bold text-cyan-400 text-xs">
                          {new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                        </div>
                      </div>
                      <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Speed Recorded</div>
                        <div className="font-bold text-emerald-400 text-xs">
                          {pt.speed ? `${pt.speed} km/h` : 'Logged'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* ── Bottom-Left Map Legend (Completely separated from Zoom Controls) ── */}
        <div className="absolute bottom-3 left-3 z-[400] pointer-events-auto bg-[#091022]/95 border border-slate-700/80 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl flex items-center gap-3 sm:gap-4 text-xs font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Status:
          </span>

          {/* Online */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-200">Online ({activeCount})</span>
          </div>

          {/* Warning */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-slate-200">Warning ({warningCount})</span>
          </div>

          {/* Offline */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="text-slate-200">Offline ({offlineCount})</span>
          </div>
        </div>
      </div>
    </div>
  )
}
