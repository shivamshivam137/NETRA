import { useState } from 'react'
import { 
  Car, 
  Truck, 
  Bike, 
  Bus, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Video, 
  Navigation, 
  Radio, 
  ChevronRight,
  ExternalLink,
  Layers,
  Activity
} from 'lucide-react'

const TYPE_ICONS = {
  car: Car,
  truck: Truck,
  motorcycle: Bike,
  bus: Bus,
}

export default function VehicleDetailsCard({ vehicle, onViewTrajectory }) {
  const [trajectoryNotice, setTrajectoryNotice] = useState(false)

  if (!vehicle) return null

  const VehicleIcon = TYPE_ICONS[vehicle.type?.toLowerCase()] || Car

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A'
    const d = new Date(isoString)
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST (${d.toLocaleDateString([], { day: '2-digit', month: 'short' })})`
  }

  const handleTrajectoryClick = () => {
    if (onViewTrajectory) {
      onViewTrajectory(vehicle)
    } else {
      setTrajectoryNotice(true)
      setTimeout(() => setTrajectoryNotice(false), 3000)
    }
  }

  return (
    <div className="bg-[#091022]/95 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-[90px] pointer-events-none opacity-20 ${
        vehicle.flagged ? 'bg-rose-500' : 'bg-cyan-500'
      }`} />

      {/* ── Top Header: Plate & Status ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          {/* Vehicle Icon Badge */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-cyan-400 shadow-md">
            <VehicleIcon size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* High-visibility license plate tag */}
              <div className="inline-flex items-center rounded-md border-2 border-slate-600 bg-slate-950 font-mono shadow-md overflow-hidden">
                <span className="bg-cyan-600 text-slate-950 font-black text-[10px] px-1.5 py-1 tracking-tighter">
                  IND
                </span>
                <span className="px-3 py-1 text-base sm:text-lg font-black tracking-widest text-white">
                  {vehicle.plate}
                </span>
              </div>

              {/* Status Pill */}
              {vehicle.flagged ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs shadow-rose-500/20">
                  <AlertTriangle size={13} />
                  {vehicle.flagReason || 'Flagged Target'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs shadow-emerald-500/20">
                  <ShieldCheck size={13} />
                  Active Track · Clean Record
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 font-medium">
              {vehicle.make} · <span className="capitalize">{vehicle.color}</span> · Category: <span className="uppercase font-mono text-slate-300 font-bold">{vehicle.type}</span>
            </p>
          </div>
        </div>

        {/* Action Button: View Trajectory */}
        <div className="flex flex-col items-stretch sm:items-end gap-1.5">
          <button
            type="button"
            onClick={handleTrajectoryClick}
            className="group px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-cyan-600/25 hover:shadow-cyan-500/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Navigation size={14} className="group-hover:rotate-45 transition-transform duration-200" />
            <span>View Trajectory</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          {trajectoryNotice && (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 animate-fade-in">
              Trajectory stream prepared for visualization
            </span>
          )}
        </div>
      </div>

      {/* ── Key Telemetry Grid (6 Metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* First Seen */}
        <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <Clock size={14} className="text-cyan-400" />
            <span className="font-mono text-[11px] uppercase font-semibold">First Seen</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-200">
            {formatTimestamp(vehicle.firstSeen)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">ANPR Entry Detection</span>
        </div>

        {/* Last Seen */}
        <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <Activity size={14} className="text-emerald-400" />
            <span className="font-mono text-[11px] uppercase font-semibold">Last Seen</span>
          </div>
          <div className="text-xs font-mono font-bold text-emerald-400">
            {formatTimestamp(vehicle.lastSeen)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Latest Sighting Ping</span>
        </div>

        {/* Cameras Detected */}
        <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <Video size={14} className="text-amber-400" />
            <span className="font-mono text-[11px] uppercase font-semibold">Cameras Detected</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-2">
            <span className="text-amber-400 text-sm">{vehicle.totalSightings} Nodes</span>
            <span className="text-[10px] text-slate-400 font-normal">({vehicle.totalSightings} Sightings)</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Multi-camera correlation</span>
        </div>

        {/* Last Known Location */}
        <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
            <MapPin size={14} className="text-rose-400" />
            <span className="font-mono text-[11px] uppercase font-semibold">Last Known Location</span>
          </div>
          <div className="text-xs font-mono font-bold text-cyan-300">
            {vehicle.currentLocation ? (
              `${vehicle.currentLocation.lat.toFixed(4)}° N, ${vehicle.currentLocation.lng.toFixed(4)}° E`
            ) : 'Corridor Unspecified'}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Mumbai Urban Grid</span>
        </div>
      </div>

      {/* ── Status & Diagnostic Sub-panel ── */}
      <div className="bg-[#070c18] border border-slate-800/80 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-emerald-400 animate-pulse" />
          <span>Vehicle ID: <strong className="text-slate-200">{vehicle.id}</strong></span>
          <span className="text-slate-600">|</span>
          <span>Status: <strong className={vehicle.flagged ? 'text-rose-400' : 'text-emerald-400'}>{vehicle.status.toUpperCase()}</strong></span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>ANPR Confidence: 99.4%</span>
          <span>·</span>
          <span>Corridor: Mumbai MMR</span>
        </div>
      </div>
    </div>
  )
}
