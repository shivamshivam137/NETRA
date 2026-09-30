import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { trafficHeatmapData as defaultHeatmapData } from '../../data/mockData'
import { 
  Flame, 
  Layers, 
  Crosshair, 
  Activity, 
  Car, 
  Gauge, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  MapPin
} from 'lucide-react'

// Density color tokens
const DENSITY_CONFIG = {
  high: {
    label: 'High Density',
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    coreColor: '#f43f5e',
    midColor: '#ef4444',
    outerColor: '#e11d48',
    glowHex: '#f43f5e',
    threshold: '> 1,100 vph',
    desc: 'Heavy Congestion · Low Speed',
  },
  medium: {
    label: 'Medium Density',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    coreColor: '#f59e0b',
    midColor: '#f97316',
    outerColor: '#fbbf24',
    glowHex: '#f59e0b',
    threshold: '600 – 1,100 vph',
    desc: 'Steady Flow · Moderate Speed',
  },
  low: {
    label: 'Low Density',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    coreColor: '#10b981',
    midColor: '#06b6d4',
    outerColor: '#14b8a6',
    glowHex: '#10b981',
    threshold: '< 600 vph',
    desc: 'Free Flow · Normal Speed',
  },
}

// Controller for map recenter / view bounds
function HeatmapController({ center, zoom, triggerRecenter, points }) {
  const map = useMap()

  useEffect(() => {
    if (triggerRecenter > 0) {
      if (points && points.length > 0) {
        const bounds = L.latLngBounds(points.map(p => [p.lat || p.latitude, p.lng || p.longitude]))
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.0 })
          return
        }
      }
      map.flyTo(center, zoom, { duration: 1.2 })
    }
  }, [triggerRecenter, map, center, zoom, points])

  return null
}

export default function TrafficHeatmap({ data = defaultHeatmapData }) {
  // Mumbai metropolitan center
  const defaultCenter = useMemo(() => [19.0400, 72.9100], [])
  const defaultZoom = 11

  const [densityFilter, setDensityFilter] = useState('all') // 'all', 'high', 'medium', 'low'
  const [recenterCount, setRecenterCount] = useState(0)

  // Filtered hotspots
  const filteredPoints = useMemo(() => {
    if (densityFilter === 'all') return data
    return data.filter(pt => pt.level === densityFilter)
  }, [data, densityFilter])

  // Count summaries
  const highCount = data.filter(p => p.level === 'high').length
  const mediumCount = data.filter(p => p.level === 'medium').length
  const lowCount = data.filter(p => p.level === 'low').length

  return (
    <div className="bg-[#091022]/95 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col space-y-0">
      {/* ── 1. Component Header ── */}
      <div className="p-4 sm:p-5 bg-[#070c18] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Traffic Density Heatmap</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-800/60 font-semibold">
                  GIS HEAT DISTRIBUTION
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Vehicle concentration across monitored areas
              </p>
            </div>
          </div>
        </div>

        {/* ── Controls & Filter Tabs ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#060a14] p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setDensityFilter('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                densityFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({data.length})
            </button>
            <button
              type="button"
              onClick={() => setDensityFilter('high')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                densityFilter === 'high'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High ({highCount})
            </button>
            <button
              type="button"
              onClick={() => setDensityFilter('medium')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                densityFilter === 'medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Medium ({mediumCount})
            </button>
            <button
              type="button"
              onClick={() => setDensityFilter('low')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                densityFilter === 'low'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Low ({lowCount})
            </button>
          </div>

          <button
            type="button"
            title="Reset Heatmap View"
            onClick={() => setRecenterCount(c => c + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-cyan-400 bg-[#060a14] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer font-mono font-medium shadow-sm"
          >
            <Crosshair size={13} />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {/* ── 2. Interactive Heatmap Leaflet Viewport ── */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-[#070d1a]">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', backgroundColor: '#070d1a' }}
        >
          <HeatmapController
            center={defaultCenter}
            zoom={defaultZoom}
            triggerRecenter={recenterCount}
            points={filteredPoints}
          />

          {/* Bottom-right Zoom Control */}
          <ZoomControl position="bottomright" />

          {/* OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          {/* ── Heatmap Density Hotspots ── */}
          {filteredPoints.map((point) => {
            const config = DENSITY_CONFIG[point.level] || DENSITY_CONFIG.medium
            const lat = point.lat || point.latitude
            const lng = point.lng || point.longitude
            const baseRadius = point.radius || (point.level === 'high' ? 900 : point.level === 'medium' ? 700 : 550)

            return (
              <div key={point.id}>
                {/* 1. Outer Heat Diffusion Zone */}
                <Circle
                  center={[lat, lng]}
                  radius={baseRadius * 1.4}
                  pathOptions={{
                    color: config.outerColor,
                    fillColor: config.outerColor,
                    fillOpacity: point.level === 'high' ? 0.22 : 0.16,
                    weight: 0,
                  }}
                />

                {/* 2. Mid Density Concentration Layer */}
                <Circle
                  center={[lat, lng]}
                  radius={baseRadius * 0.85}
                  pathOptions={{
                    color: config.midColor,
                    fillColor: config.midColor,
                    fillOpacity: point.level === 'high' ? 0.38 : 0.28,
                    weight: 0,
                  }}
                />

                {/* 3. Core Thermal Intensity Node */}
                <Circle
                  center={[lat, lng]}
                  radius={baseRadius * 0.4}
                  pathOptions={{
                    color: config.coreColor,
                    fillColor: config.coreColor,
                    fillOpacity: point.level === 'high' ? 0.65 : 0.48,
                    weight: 1.5,
                    opacity: 0.8,
                  }}
                >
                  <Popup className="netra-custom-popup">
                    <div className="p-3.5 bg-[#091022] text-slate-100 rounded-lg min-w-[260px] font-sans shadow-2xl border border-slate-700/80">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Flame size={15} style={{ color: config.glowHex }} />
                          <span className="font-bold text-xs text-white font-mono">{point.id}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${config.badgeColor}`}>
                          {config.label}
                        </span>
                      </div>

                      {/* Hotspot Location Info */}
                      <div className="mb-2.5">
                        <div className="text-xs font-bold text-white">{point.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-cyan-400" />
                          <span>{point.zone}</span>
                        </div>
                      </div>

                      {/* Intensity Score Bar */}
                      <div className="bg-[#060a14] p-2 rounded border border-slate-800 mb-2 font-mono">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Thermal Index</span>
                          <span className="font-bold text-white">{(point.intensity * 100).toFixed(0)}% Intensity</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${point.intensity * 100}%`,
                              backgroundColor: config.glowHex 
                            }}
                          />
                        </div>
                      </div>

                      {/* Density Telemetry Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                        <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Flow Volume</div>
                          <div className="font-bold text-cyan-400 text-xs">
                            {point.vehicleCount.toLocaleString()} vph
                          </div>
                        </div>
                        <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Avg Speed</div>
                          <div className="font-bold text-emerald-400 text-xs">
                            {point.avgSpeed} km/h
                          </div>
                        </div>
                      </div>

                      {/* Status footer */}
                      <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span className="text-slate-500">{point.status}</span>
                        <span className="text-cyan-400/90">{lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
                      </div>
                    </div>
                  </Popup>
                </Circle>

                {/* 4. Center Focal Point Marker */}
                <CircleMarker
                  center={[lat, lng]}
                  radius={4.5}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: config.coreColor,
                    fillOpacity: 1,
                    weight: 1.5,
                  }}
                />
              </div>
            )
          })}
        </MapContainer>

        {/* ── 3. Bottom-Left Density Legend ── */}
        <div className="absolute bottom-3 left-3 z-[400] pointer-events-auto bg-[#091022]/95 border border-slate-700/80 backdrop-blur-md px-3.5 py-2.5 rounded-lg shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <Layers size={13} className="text-cyan-400" />
            <span>Density Legend:</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Low */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <div className="flex flex-col">
                <span className="text-slate-200 font-semibold leading-tight">Low</span>
                <span className="text-[9px] text-slate-500 leading-tight">&lt; 600 vph</span>
              </div>
            </div>

            {/* Medium */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              <div className="flex flex-col">
                <span className="text-slate-200 font-semibold leading-tight">Medium</span>
                <span className="text-[9px] text-slate-500 leading-tight">600–1,100 vph</span>
              </div>
            </div>

            {/* High */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <div className="flex flex-col">
                <span className="text-slate-200 font-semibold leading-tight">High</span>
                <span className="text-[9px] text-slate-500 leading-tight">&gt; 1,100 vph</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
