import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  trafficHeatmapData as mockHeatmap,
  trajectories as mockTrajectories 
} from '../../data/mockData'
import { PRIMARY_INCIDENT, NETWORK_CAMERAS } from '../../services/trafficPreventionEngine'
import { 
  Layers, 
  Crosshair, 
  Video, 
  Flame, 
  Route as RouteIcon, 
  Car, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Gauge, 
  SlidersHorizontal,
  Navigation,
  Sparkles,
  Zap
} from 'lucide-react'

// ─── Custom Camera Marker Icon ────────────────────────────────────────────────
const createCameraIcon = (cam, isSelected = false) => {
  let colorClass = 'bg-emerald-500 border-emerald-300 text-emerald-300 shadow-emerald-500/50'
  let ringPulse = 'bg-emerald-400'

  if (cam.congestion === 'CRITICAL') {
    colorClass = 'bg-rose-500 border-rose-300 text-rose-300 shadow-rose-500/50'
    ringPulse = 'bg-rose-400'
  } else if (cam.congestion === 'HEAVY') {
    colorClass = 'bg-orange-500 border-orange-300 text-orange-300 shadow-orange-500/50'
    ringPulse = 'bg-orange-400'
  } else if (cam.congestion === 'MODERATE') {
    colorClass = 'bg-amber-500 border-amber-300 text-amber-300 shadow-amber-500/50'
    ringPulse = 'bg-amber-400'
  }

  return L.divIcon({
    className: 'custom-leaflet-camera-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center group cursor-pointer">
        ${isSelected ? '<span class="absolute -inset-2 rounded-full bg-cyan-400 opacity-60 animate-ping"></span>' : ''}
        <div class="relative w-8 h-8 rounded-full ${colorClass} border-2 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-125 ${isSelected ? 'scale-125 ring-2 ring-cyan-400' : ''}">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
            <rect x="2" y="6" width="14" height="12" rx="2"/>
          </svg>
        </div>
        <div class="text-[9px] font-mono font-bold bg-slate-950/90 text-white px-1 rounded border border-slate-700 mt-0.5 whitespace-nowrap">
          ${cam.id}
        </div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 22],
    popupAnchor: [0, -22],
  })
}

// ─── Custom Pulsing Predicted Congestion Marker Icon (Section 12) ─────────────
const createPredictedCongestionIcon = (cam) => {
  return L.divIcon({
    className: 'custom-leaflet-prediction-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer group">
        <span class="absolute -inset-3 rounded-full bg-rose-500 opacity-50 animate-ping"></span>
        <div class="relative w-10 h-10 rounded-full bg-rose-950/90 border-2 border-dashed border-rose-400 flex items-center justify-center shadow-xl shadow-rose-500/50 animate-pulse">
          <span class="text-xs">🔮</span>
        </div>
        <div class="text-[9px] font-mono font-black text-rose-300 bg-slate-950/95 px-1.5 py-0.5 rounded border border-rose-500/50 mt-1 uppercase tracking-wider shadow-lg">
          PREDICTED IN ${cam.prediction?.minutes || 7}m
        </div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 26],
    popupAnchor: [0, -26],
  })
}

// ─── Custom Signal Control Marker Icon ─────────────────────────────────────────
const createSignalIcon = (isExecuted = false) => {
  return L.divIcon({
    className: 'custom-leaflet-signal-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer group">
        <span class="absolute -inset-2 rounded-full bg-emerald-400 opacity-40 animate-ping"></span>
        <div class="relative w-9 h-9 rounded-xl bg-slate-950 border-2 border-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform group-hover:scale-115">
          <div class="flex flex-col gap-0.5 items-center justify-center p-1">
            <div class="w-2 h-2 rounded-full bg-rose-500/40"></div>
            <div class="w-2 h-2 rounded-full bg-amber-400/40"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse"></div>
          </div>
        </div>
        <div class="text-[9px] font-mono font-bold text-emerald-300 bg-slate-900/90 px-1.5 rounded border border-emerald-500/40 mt-1 uppercase">
          ${isExecuted ? 'SIM: 50s' : 'AI Signal'}
        </div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

// ─── Custom Route Waypoint Marker ─────────────────────────────────────────────
const createRoutePointIcon = (label, color = 'emerald') => {
  const bg = color === 'emerald' ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-emerald-500/50' : 'bg-rose-500 border-rose-300 text-white shadow-rose-500/50'
  return L.divIcon({
    className: 'custom-leaflet-route-point',
    html: `
      <div class="relative flex flex-col items-center cursor-pointer group">
        <div class="w-6 h-6 rounded-full ${bg} border-2 flex items-center justify-center shadow-md font-mono text-[10px] font-black transition-transform group-hover:scale-125">
          ${label}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

// ─── Trajectory Node Marker Icon ──────────────────────────────────────────────
const createTrajectoryIcon = (seq) => {
  return L.divIcon({
    className: 'custom-leaflet-trajectory-point',
    html: `
      <div class="relative flex items-center justify-center group cursor-pointer">
        <div class="w-5 h-5 rounded-full bg-cyan-600 border border-cyan-300 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm">
          ${seq}
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  })
}

// ─── Map Controller (FlyTo / AutoBounds / Focus Camera) ───────────────────────
function MapCameraController({ selectedCamera, triggerRecenter, boundsPoints }) {
  const map = useMap()

  // Fly to selected camera when selection changes
  useEffect(() => {
    if (selectedCamera && selectedCamera.lat && selectedCamera.lng) {
      map.flyTo([selectedCamera.lat, selectedCamera.lng], 13.5, { duration: 1.0 })
    }
  }, [selectedCamera, map])

  // Fit corridor bounds when user triggers recenter button
  useEffect(() => {
    if (triggerRecenter > 0 && boundsPoints && boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints)
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.0 })
      }
    }
  }, [triggerRecenter, boundsPoints, map])

  return null
}

export default function PreventionMapView({
  simulationPhase = 1,
  isExecuted = false,
  cameras = NETWORK_CAMERAS,
  selectedCameraId = 'CAM-003',
  filterCameraId = 'ALL',
  onSelectCamera = () => {},
}) {
  const defaultCenter = useMemo(() => [19.0620, 72.9350], [])
  const defaultZoom = 11

  // Layer Toggles
  const [layers, setLayers] = useState({
    heatmap: true,
    trajectories: true,
    cameras: true,
    preventionRoute: true,
    predictions: true,
  })

  const [recenterCount, setRecenterCount] = useState(0)

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }))
  }

  // Selected camera object
  const selectedCamera = useMemo(() => {
    return cameras.find(c => c.id === selectedCameraId) || cameras[0]
  }, [cameras, selectedCameraId])

  // If a camera filter is active, only show the filtered camera on the map, or all if ALL
  const mapCameras = useMemo(() => {
    if (filterCameraId !== 'ALL') {
      return cameras.filter(c => c.id === filterCameraId)
    }
    return cameras
  }, [cameras, filterCameraId])

  // Congested and Alternate Route Coordinates (Road-Network Turn-by-Turn Geometry)
  const congestedRoute = PRIMARY_INCIDENT.routePlan.currentRoute
  const alternateRoute = PRIMARY_INCIDENT.routePlan.alternateRoute

  // Pre-calculate all route waypoints for auto-bounds
  const allRouteCoords = useMemo(() => [
    ...congestedRoute.coordinates,
    ...alternateRoute.coordinates,
  ], [congestedRoute, alternateRoute])

  // Cameras with predicted congestion (Section 12: Pulsing marker)
  const predictedHotspotCameras = useMemo(() => {
    return mapCameras.filter(c => c.prediction?.status === 'EXPECTED' || c.prediction?.status === 'LIKELY')
  }, [mapCameras])

  return (
    <div className="relative w-full h-[520px] sm:h-[580px] rounded-xl overflow-hidden border border-slate-800/90 bg-[#070d1a] shadow-2xl flex flex-col">
      {/* ── Top Map Control & Layer Toggle Bar ── */}
      <div className="min-h-12 bg-[#091022] border-b border-slate-800/90 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20 flex-shrink-0">
        {/* Left: GIS Map Title & Active Focus */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-white uppercase font-mono">
              NETRA GIS PREDICTIVE MAP
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400">Focused:</span>
            <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              {selectedCamera?.id} · {selectedCamera?.name}
            </span>
          </div>
        </div>

        {/* Right: Layer Toggles & Fit Corridor */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#060a14] p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            {/* Heatmap Toggle */}
            <button
              onClick={() => toggleLayer('heatmap')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                layers.heatmap 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame size={12} />
              <span>Heatmap</span>
            </button>

            {/* Trajectories Toggle */}
            <button
              onClick={() => toggleLayer('trajectories')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                layers.trajectories 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car size={12} />
              <span>Trajectories</span>
            </button>

            {/* Cameras Toggle */}
            <button
              onClick={() => toggleLayer('cameras')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                layers.cameras 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video size={12} />
              <span>Cameras ({cameras.length})</span>
            </button>

            {/* Predictions Toggle */}
            <button
              onClick={() => toggleLayer('predictions')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                layers.predictions 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={12} />
              <span>Predictions</span>
            </button>

            {/* Prevention Route Toggle */}
            <button
              onClick={() => toggleLayer('preventionRoute')}
              className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                layers.preventionRoute 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RouteIcon size={12} />
              <span>Routes</span>
            </button>
          </div>

          {/* Fit Corridor Button */}
          <button
            onClick={() => setRecenterCount((c) => c + 1)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-cyan-400 bg-[#060a14] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer font-mono shadow-sm"
          >
            <Crosshair size={13} />
            <span>Fit Corridor</span>
          </button>
        </div>
      </div>

      {/* ── Leaflet Interactive Viewport ── */}
      <div className="flex-1 w-full h-full relative z-0 min-h-0">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', backgroundColor: '#070d1a' }}
        >
          <MapCameraController
            selectedCamera={selectedCamera}
            triggerRecenter={recenterCount}
            boundsPoints={allRouteCoords}
          />

          <ZoomControl position="bottomright" />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* ══════════════════════════════════════════════════════════════════════
              LAYER 1: HEATMAP (Existing Netra Traffic Intensity)
          ══════════════════════════════════════════════════════════════════════ */}
          {layers.heatmap && mockHeatmap.map((point) => {
            const isCriticalPoint = point.id === 'HM-005' || point.name.includes('Vashi')
            const activeIntensity = isExecuted && isCriticalPoint ? 0.45 : point.intensity
            const activeColor = activeIntensity > 0.85 ? '#f43f5e' : activeIntensity > 0.6 ? '#f59e0b' : '#10b981'

            return (
              <Circle
                key={`heatmap-${point.id}`}
                center={[point.lat, point.lng]}
                radius={(point.radius || 750) * 0.7}
                pathOptions={{
                  color: activeColor,
                  fillColor: activeColor,
                  fillOpacity: activeIntensity > 0.8 ? 0.55 : 0.35,
                  weight: isCriticalPoint ? 2.5 : 1.2,
                }}
              />
            )
          })}

          {/* ══════════════════════════════════════════════════════════════════════
              LAYER 2: VEHICLE TRAJECTORIES (Road-Following Influx Streams)
          ══════════════════════════════════════════════════════════════════════ */}
          {layers.trajectories && mockTrajectories.slice(0, 3).map((traj, tIdx) => {
            const pathCoords = (traj.roadCoordinates && traj.roadCoordinates.length > 0)
              ? traj.roadCoordinates
              : traj.points.map(p => [p.lat || p.latitude, p.lng || p.longitude])
            const colors = ['#06b6d4', '#8b5cf6', '#3b82f6']
            const strokeColor = colors[tIdx % colors.length]

            return (
              <div key={`traj-group-${traj.vehicleId}`}>
                {/* Road-Following Trajectory Polyline */}
                <Polyline
                  positions={pathCoords}
                  pathOptions={{
                    color: strokeColor,
                    weight: 3.5,
                    opacity: 0.85,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
                {traj.points.map((pt, pIdx) => (
                  <Marker
                    key={`traj-pt-${traj.vehicleId}-${pIdx}`}
                    position={[pt.lat || pt.latitude, pt.lng || pt.longitude]}
                    icon={createTrajectoryIcon(pt.sequence || pIdx + 1)}
                  >
                    <Popup className="netra-custom-popup">
                      <div className="p-2.5 bg-[#091022] text-white rounded text-xs font-mono">
                        <div className="text-cyan-400 font-bold mb-1">Vehicle Trajectory: {traj.plate}</div>
                        <div>Node #{pt.sequence || pIdx + 1}: {pt.cameraName}</div>
                        <div className="text-slate-400 text-[10px] mt-1">Converging along road network towards CAM-003</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </div>
            )
          })}

          {/* ══════════════════════════════════════════════════════════════════════
              LAYER 3: PREVENTION ROUTES (Red Line vs Green Line)
          ══════════════════════════════════════════════════════════════════════ */}
          {layers.preventionRoute && (
            <>
              {/* Current Congested Route (RED LINE - Road Network) */}
              <Polyline
                positions={congestedRoute.coordinates}
                pathOptions={{
                  color: '#f43f5e',
                  weight: 8,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={congestedRoute.coordinates}
                pathOptions={{
                  color: '#e11d48',
                  weight: 4,
                  dashArray: '10, 6',
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* AI Recommended Alternate Route (GREEN LINE - Road Network) */}
              <Polyline
                positions={alternateRoute.coordinates}
                pathOptions={{
                  color: '#10b981',
                  weight: 9,
                  opacity: isExecuted ? 0.6 : 0.4,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={alternateRoute.coordinates}
                pathOptions={{
                  color: '#34d399',
                  weight: 4.5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Route Endpoints & Signal Control Node (CAM-003 Vashi Toll Plaza) */}
              <Marker
                position={[19.0544, 72.9312]}
                icon={createSignalIcon(isExecuted)}
                zIndexOffset={3500}
              >
                <Popup className="netra-custom-popup">
                  <div className="p-3 bg-[#091022] text-white rounded text-xs font-mono">
                    <div className="text-emerald-400 font-bold mb-1">🚦 CAM-003 Junction A Signal Control Node</div>
                    <div>North-South: 30s → 50s (+20s)</div>
                    <div>East-West: 30s → 10s (-20s)</div>
                    <div className="text-slate-400 text-[10px] mt-1">{isExecuted ? 'Simulation Executed' : 'Awaiting Approval'}</div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              LAYER 4: PREDICTED CONGESTION (Pulsing / Glowing Markers - Section 12)
          ══════════════════════════════════════════════════════════════════════ */}
          {layers.predictions && predictedHotspotCameras.map((pCam) => (
            <Marker
              key={`pred-marker-${pCam.id}`}
              position={[pCam.lat, pCam.lng]}
              icon={createPredictedCongestionIcon(pCam)}
              zIndexOffset={3000}
            >
              <Popup className="netra-custom-popup">
                <div className="p-3.5 bg-[#091022] text-white rounded-lg min-w-[270px] font-mono text-xs shadow-2xl border border-rose-500/50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="font-black text-rose-400 flex items-center gap-1.5">
                      <span>🔮 TRAFFIC PREDICTION</span>
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                      {pCam.id}
                    </span>
                  </div>

                  <div className="text-slate-300 font-bold mb-2">
                    {pCam.name}
                  </div>

                  <div className="space-y-1 text-slate-300 mb-2">
                    <p>Current: <strong className="text-white">{pCam.currentVehicles} vehicles</strong></p>
                    <p>Predicted in 10 min: <strong className="text-amber-300">{pCam.prediction?.predictedVehicles} vehicles</strong></p>
                    <p>Current speed: <strong className="text-cyan-300">{pCam.avgSpeed} km/h</strong></p>
                    <p>Predicted speed: <strong className="text-rose-400">{pCam.prediction?.predictedSpeed} km/h</strong></p>
                    <p>Expected: <strong className="text-rose-400 font-black">{pCam.prediction?.level} CONGESTION</strong></p>
                    <p>Expected in: <strong className="text-rose-400">{pCam.prediction?.minutes} minutes</strong></p>
                    <p>Confidence: <strong className="text-cyan-400">{pCam.prediction?.confidence}%</strong></p>
                  </div>

                  <div className="p-2 rounded bg-[#060a14] border border-cyan-500/30 text-[10px] text-cyan-300">
                    Cause: {pCam.prediction?.cause}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ══════════════════════════════════════════════════════════════════════
              LAYER 5: EVERY CAMERA DISPLAYED INDIVIDUALLY (Section 3)
          ══════════════════════════════════════════════════════════════════════ */}
          {layers.cameras && mapCameras.map((cam) => {
            const isSelected = cam.id === selectedCameraId

            return (
              <Marker
                key={`cam-node-${cam.id}`}
                position={[cam.lat, cam.lng]}
                icon={createCameraIcon(cam, isSelected)}
                eventHandlers={{
                  click: () => onSelectCamera(cam.id),
                }}
              >
                <Popup className="netra-custom-popup">
                  <div className="p-3 bg-[#091022] text-slate-100 rounded-lg min-w-[250px] font-mono text-xs shadow-2xl border border-slate-700">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Video size={14} className="text-cyan-400" />
                        <span className="font-bold text-white">{cam.id}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        cam.congestion === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        cam.congestion === 'HEAVY' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                        cam.congestion === 'MODERATE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {cam.congestion}
                      </span>
                    </div>

                    <div className="text-slate-300 font-bold mb-2">
                      {cam.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2 bg-[#060a14] rounded border border-slate-800 text-[11px] mb-2">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Current</span>
                        <strong className="text-white">{cam.currentVehicles} veh</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Avg Speed</span>
                        <strong className="text-cyan-400">{cam.avgSpeed} km/h</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Current Green</span>
                        <strong className="text-slate-300">{cam.currentGreen}s</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">AI Green</span>
                        <strong className="text-emerald-400">{cam.aiGreen}s ({cam.delta > 0 ? `+${cam.delta}` : cam.delta}s)</strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-cyan-300 bg-cyan-950/40 p-1.5 rounded border border-cyan-800/40">
                      🔮 {cam.prediction?.text}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* ── Section 8: MAP LEGEND (Mandatory Exact Match) ── */}
        <div className="absolute bottom-3 left-3 z-[400] pointer-events-auto bg-[#091022]/95 border border-slate-700/80 backdrop-blur-md px-3.5 py-2.5 rounded-lg shadow-2xl flex flex-col gap-2 text-xs font-mono max-w-[calc(100%-24px)] sm:max-w-none">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Layers size={13} className="text-cyan-400" />
              <span>Map Symbology Legend</span>
            </span>
            <span className="text-[9px] text-cyan-400 font-semibold uppercase">
              GIS Prediction Grid
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-1.5 text-[11px]">
            {/* RED = Current Congestion */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span className="text-slate-300">RED = Current congestion</span>
            </div>

            {/* ORANGE = Heavy traffic */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
              <span className="text-slate-300">ORANGE = Heavy traffic</span>
            </div>

            {/* YELLOW = Moderate */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-slate-300">YELLOW = Moderate</span>
            </div>

            {/* GREEN = Normal */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-slate-300">GREEN = Normal</span>
            </div>

            {/* CAMERA = Camera */}
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400">📹</span>
              <span className="text-slate-300">CAMERA = Camera</span>
            </div>

            {/* ARROW = Vehicle trajectory */}
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400">➡️</span>
              <span className="text-slate-300">ARROW = Vehicle trajectory</span>
            </div>

            {/* RED LINE = Current route */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-rose-500 rounded-full" />
              <span className="text-slate-300">RED LINE = Current route</span>
            </div>

            {/* GREEN LINE = AI alternate route */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-emerald-400 rounded-full" />
              <span className="text-slate-300">GREEN LINE = AI alternate route</span>
            </div>

            {/* PULSING MARKER = Predicted congestion */}
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <span className="text-rose-300 font-bold">PULSING MARKER = Predicted congestion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
