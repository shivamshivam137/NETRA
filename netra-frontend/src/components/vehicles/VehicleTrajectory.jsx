import { useMemo } from 'react'
import { 
  ArrowLeft, 
  Navigation, 
  MapPin, 
  Clock, 
  Video, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight,
  Route,
  Car,
  Compass,
  Zap,
  Info
} from 'lucide-react'
import MapView from '../map/MapView'
import { cameras as allCameras } from '../../data/mockData'

export default function VehicleTrajectory({ vehicle, trajectory, onBack }) {
  if (!vehicle) return null

  const points = trajectory?.points || []
  const hasTrajectory = points.length > 0

  const firstSeen = points[0]?.timestamp || vehicle.firstSeen
  const lastSeen = points[points.length - 1]?.timestamp || vehicle.lastSeen

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A'
    const d = new Date(isoString)
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST (${d.toLocaleDateString([], { day: '2-digit', month: 'short' })})`
  }

  const formatTimeOnly = (isoString) => {
    if (!isoString) return 'N/A'
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate total span in minutes if available
  const durationText = useMemo(() => {
    if (!firstSeen || !lastSeen) return null
    const diffMs = new Date(lastSeen) - new Date(firstSeen)
    const diffMins = Math.round(diffMs / 60000)
    if (diffMins <= 0) return 'Instantaneous'
    if (diffMins < 60) return `${diffMins} mins tracking span`
    const hrs = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hrs}h ${mins}m tracking span`
  }, [firstSeen, lastSeen])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Top Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#091022]/95 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#060a14] hover:bg-slate-800 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Vehicle</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Route size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Vehicle Trajectory Map</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
                  GIS SIGHTINGS CORRELATION
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* License Plate Tag */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-slate-600 bg-slate-950 font-mono shadow-sm overflow-hidden text-xs">
            <span className="bg-cyan-600 text-slate-950 font-black text-[9px] px-1.5 py-1 tracking-tighter">
              IND
            </span>
            <span className="px-2.5 py-0.5 font-bold tracking-wider text-white">
              {vehicle.plate}
            </span>
          </div>

          {vehicle.flagged ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle size={11} />
              Flagged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck size={11} />
              Clean
            </span>
          )}
        </div>
      </div>

      {/* ── Trajectory Summary Metrics Card ── */}
      <div className="bg-[#091022]/95 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        {/* Metric tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Vehicle Plate */}
          <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Car size={14} className="text-cyan-400" />
              <span className="font-mono text-[11px] uppercase font-semibold">Vehicle</span>
            </div>
            <div className="text-sm font-mono font-black text-white">
              {vehicle.plate}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              {vehicle.make} ({vehicle.color})
            </span>
          </div>

          {/* Cameras Visited */}
          <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Video size={14} className="text-amber-400" />
              <span className="font-mono text-[11px] uppercase font-semibold">Cameras Visited</span>
            </div>
            <div className="text-sm font-mono font-black text-amber-400 flex items-center gap-1.5">
              <span>{points.length} Nodes</span>
              <span className="text-[10px] text-slate-400 font-normal">({points.length} Correlated Fixes)</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Sequential Surveillance
            </span>
          </div>

          {/* First Seen */}
          <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock size={14} className="text-cyan-400" />
              <span className="font-mono text-[11px] uppercase font-semibold">First Seen</span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-200">
              {formatTimestamp(firstSeen)}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Initial ANPR Sighting
            </span>
          </div>

          {/* Last Seen */}
          <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Activity size={14} className="text-emerald-400" />
              <span className="font-mono text-[11px] uppercase font-semibold">Last Seen</span>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400">
              {formatTimestamp(lastSeen)}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              {durationText || 'Latest Position Ping'}
            </span>
          </div>
        </div>

        {/* ── Visual Route Sequence Banner ── */}
        <div className="bg-[#060a14] border border-slate-800/90 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass size={13} className="text-cyan-400" />
              Camera Path Trajectory ({points.length} Nodes)
            </span>
            <span className="text-[10px] text-slate-500">
              Sequential Order: Entry → Exit
            </span>
          </div>

          {/* Sequence badges list */}
          {hasTrajectory ? (
            <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
              {points.map((pt, idx) => {
                const isFirst = idx === 0
                const isLast = idx === points.length - 1
                return (
                  <div key={`seq-badge-${pt.cameraId}-${idx}`} className="flex items-center gap-2 flex-shrink-0">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      isFirst 
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40' 
                        : isLast 
                        ? 'bg-amber-950/50 text-amber-300 border-amber-500/40' 
                        : 'bg-[#091022] text-cyan-300 border-slate-700/80'
                    }`}>
                      <span className={`w-4 h-4 rounded-full font-black text-[9px] flex items-center justify-center ${
                        isFirst ? 'bg-emerald-400 text-slate-950' : isLast ? 'bg-amber-400 text-slate-950' : 'bg-cyan-400 text-slate-950'
                      }`}>
                        {pt.sequence || idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-white leading-tight">{pt.cameraId}</span>
                        <span className="text-[9px] text-slate-400 font-sans leading-tight">
                          {formatTimeOnly(pt.timestamp)} IST
                        </span>
                      </div>
                    </div>

                    {!isLast && (
                      <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono py-2">
              No historical trajectory points recorded for this vehicle.
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive GIS Trajectory Map ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap size={13} className="text-cyan-400" />
            GIS Trajectory Visualization & Camera Corridors
          </span>
          <span className="text-[11px] text-cyan-400/90">
            Map automatically fits to complete route bounds
          </span>
        </div>

        <MapView
          cameras={allCameras}
          selectedTrajectory={trajectory}
          fullHeight={true}
        />
      </div>

      {/* ── Detailed Telemetry Sequence Table ── */}
      <div className="bg-[#091022]/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#070c18] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Chronological Sighting Nodes ({points.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {vehicle.plate} Telemetry Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060a14] border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-3.5">Seq #</th>
                <th className="p-3.5">Camera ID</th>
                <th className="p-3.5">Camera Location & Name</th>
                <th className="p-3.5">Coordinates (Lat, Lng)</th>
                <th className="p-3.5">Detection Time</th>
                <th className="p-3.5">Speed Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {points.map((pt, idx) => {
                const isFirst = idx === 0
                const isLast = idx === points.length - 1
                return (
                  <tr key={`tbl-row-${pt.cameraId}-${idx}`} className="hover:bg-[#0c1428] transition-colors">
                    <td className="p-3.5">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-black text-[10px] ${
                        isFirst ? 'bg-emerald-400 text-slate-950' : isLast ? 'bg-amber-400 text-slate-950' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        #{pt.sequence || idx + 1}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {pt.cameraId}
                    </td>
                    <td className="p-3.5 font-sans font-medium text-slate-200">
                      <div>{pt.cameraName || `Camera ${pt.cameraId}`}</div>
                      {pt.cameraLocation && (
                        <div className="text-[10px] text-slate-400 font-mono">{pt.cameraLocation}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-cyan-400 text-[11px]">
                      {(pt.lat || pt.latitude).toFixed(4)}° N, {(pt.lng || pt.longitude).toFixed(4)}° E
                    </td>
                    <td className="p-3.5 text-slate-300 text-[11px]">
                      {formatTimestamp(pt.timestamp)}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-400">
                        {pt.speed ? `${pt.speed} km/h` : 'Captured'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
