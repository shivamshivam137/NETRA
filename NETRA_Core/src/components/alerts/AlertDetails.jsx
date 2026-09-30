import { useNavigate } from 'react-router-dom'
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Car, 
  Video, 
  MapPin, 
  Clock, 
  Navigation, 
  CheckCircle2, 
  ChevronRight, 
  Radio, 
  Gauge, 
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'

export default function AlertDetails({ alert, onClose, onStatusChange }) {
  const navigate = useNavigate()

  if (!alert) return null

  const severityLower = alert.severity?.toLowerCase()
  const statusLower = alert.status?.toLowerCase()

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A'
    const d = new Date(isoString)
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST (${d.toLocaleDateString([], { day: '2-digit', month: 'short' })})`
  }

  const handleViewVehicle = () => {
    if (alert.vehiclePlate || alert.plate) {
      const plate = alert.vehiclePlate || alert.plate
      navigate(`/vehicles?plate=${encodeURIComponent(plate)}`)
    }
  }

  const handleViewTrajectory = () => {
    if (alert.vehiclePlate || alert.plate) {
      const plate = alert.vehiclePlate || alert.plate
      navigate(`/vehicles?plate=${encodeURIComponent(plate)}&view=trajectory`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      {/* Modal Card */}
      <div 
        className="bg-[#091022] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 relative text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-5 bg-[#070c18] border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              severityLower === 'critical' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
              severityLower === 'high' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
              'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
            }`}>
              <ShieldAlert size={22} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold font-mono text-white tracking-wide">
                  {alert.id}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${
                  severityLower === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  severityLower === 'high' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {alert.severity} Priority
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  statusLower === 'active' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                  statusLower === 'investigating' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                  'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}>
                  {alert.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-200 mt-0.5">
                {alert.type}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#060a14] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-140px)] overflow-y-auto custom-scrollbar">
          {/* Description Callout */}
          <div className="bg-[#060a14] border border-slate-800/90 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Info size={13} className="text-cyan-400" />
              Incident Narrative
            </span>
            <p className="text-sm text-slate-200 font-sans leading-relaxed">
              {alert.description || alert.message}
            </p>
          </div>

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
            {/* Vehicle Card (if applicable) */}
            <div className="bg-[#070c18] border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Car size={14} className="text-cyan-400" />
                <span className="text-[11px] uppercase font-semibold">Target Vehicle</span>
              </div>
              {alert.vehiclePlate || alert.plate ? (
                <div>
                  <div className="inline-flex items-center rounded-md border border-slate-600 bg-slate-950 text-xs font-bold text-white px-2 py-0.5 mb-1">
                    <span className="bg-cyan-600 text-slate-950 text-[9px] px-1 py-0.5 mr-1.5 rounded-xs font-black">IND</span>
                    {alert.vehiclePlate || alert.plate}
                  </div>
                  <div className="text-[10px] text-slate-500">ID: {alert.vehicleId || 'Correlated Target'}</div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs italic py-1">
                  Non-vehicular / Camera Grid Incident
                </div>
              )}
            </div>

            {/* Camera Sensor Card */}
            <div className="bg-[#070c18] border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Video size={14} className="text-amber-400" />
                <span className="text-[11px] uppercase font-semibold">Optical Sensor Node</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {alert.cameraId || 'Unspecified'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {alert.cameraName || 'Surveillance Node'}
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-[#070c18] border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <MapPin size={14} className="text-rose-400" />
                <span className="text-[11px] uppercase font-semibold">Corridor Location</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {alert.location || 'Mumbai MMR Grid'}
                </div>
                {alert.coords && (
                  <div className="text-[10px] text-cyan-400 mt-0.5">
                    {alert.coords.lat.toFixed(4)}° N, {alert.coords.lng.toFixed(4)}° E
                  </div>
                )}
              </div>
            </div>

            {/* Timestamp & Speed */}
            <div className="bg-[#070c18] border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Clock size={14} className="text-emerald-400" />
                <span className="text-[11px] uppercase font-semibold">Detection Timestamp</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {formatTimestamp(alert.timestamp)}
                </div>
                {alert.speed && (
                  <div className="text-[10px] text-rose-400 font-bold mt-0.5">
                    Logged Speed: {alert.speed} km/h
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Vehicle Actions (Only shown if vehiclePlate exists) */}
          {(alert.vehiclePlate || alert.plate) && (
            <div className="bg-[#070c18] border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation size={13} />
                  Vehicle Intelligence Integration
                </span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Inspect full ANPR profile or correlate trajectory movement
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={handleViewVehicle}
                  className="px-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition-colors cursor-pointer font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Car size={13} />
                  <span>View Vehicle</span>
                </button>
                <button
                  type="button"
                  onClick={handleViewTrajectory}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                >
                  <Navigation size={13} />
                  <span>View Trajectory</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-[#070c18] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          {/* Status update actions */}
          <div className="flex items-center gap-2">
            {statusLower === 'active' && onStatusChange && (
              <button
                type="button"
                onClick={() => onStatusChange(alert.id, 'Investigating')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1.5 font-semibold"
              >
                <Clock size={13} />
                <span>Mark Investigating</span>
              </button>
            )}
            {statusLower !== 'resolved' && onStatusChange && (
              <button
                type="button"
                onClick={() => onStatusChange(alert.id, 'Resolved')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1.5 font-semibold"
              >
                <CheckCircle2 size={13} />
                <span>Resolve Incident</span>
              </button>
            )}
            {statusLower === 'resolved' && (
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={15} /> Incident Resolved
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
