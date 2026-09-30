import { useState } from 'react'
import { 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Video, 
  Car, 
  Search,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { alerts as rawAlerts } from '../../data/mockData'

const SEVERITY_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const SEVERITY_CONFIG = {
  critical: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    border: 'border-rose-500/40 hover:border-rose-500/80',
    glow: 'bg-rose-500',
    icon: AlertCircle,
  },
  high: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/40 hover:border-amber-500/80',
    glow: 'bg-amber-500',
    icon: AlertTriangle,
  },
  medium: {
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    border: 'border-cyan-500/40 hover:border-cyan-500/80',
    glow: 'bg-cyan-500',
    icon: AlertTriangle,
  },
  low: {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    border: 'border-slate-700 hover:border-slate-600',
    glow: 'bg-slate-500',
    icon: AlertCircle,
  },
}

export default function AlertFeed() {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  // Filter and sort alerts
  const filteredAlerts = [...rawAlerts]
    .filter(alert => {
      const sevLower = alert.severity?.toLowerCase()
      if (severityFilter !== 'all' && sevLower !== severityFilter.toLowerCase()) return false
      if (!searchTerm) return true
      const query = searchTerm.toLowerCase()
      return (
        (alert.message || alert.description || '').toLowerCase().includes(query) ||
        (alert.plate || alert.vehiclePlate || '').toLowerCase().includes(query) ||
        (alert.cameraId || '').toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      const aSev = a.severity?.toLowerCase()
      const bSev = b.severity?.toLowerCase()
      const weightDiff = (SEVERITY_WEIGHT[bSev] || 0) - (SEVERITY_WEIGHT[aSev] || 0)
      if (weightDiff !== 0) return weightDiff
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

  return (
    <div className="bg-[#091022]/90 backdrop-blur-xs border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col h-[480px] sm:h-[540px] shadow-2xl">
      {/* ── Header ── */}
      <div className="pb-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white font-mono">
                Live Alert Feed
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Real-time safety events</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            {rawAlerts.filter(a => a.status === 'open').length} Active
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter plate, camera or incident..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#060a14] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors font-mono"
          />
        </div>
      </div>

      {/* ── Alert Feed Items ── */}
      <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1 custom-scrollbar">
        {filteredAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <CheckCircle2 size={32} className="text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">No active alerts match query</p>
            <p className="text-[11px]">All clear or criteria filtered out</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg bg-[#070c18] border ${config.border} hover:bg-[#0c1428] transition-all duration-150 flex flex-col gap-2 group cursor-pointer shadow-sm`}
              >
                {/* Top Row: Severity & Timestamp */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono border ${config.badge}`}>
                    {alert.severity}
                  </span>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono font-medium">
                    <Clock size={11} className="text-slate-500" />
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message */}
                <p className="text-xs text-slate-100 font-medium leading-snug group-hover:text-cyan-200 transition-colors">
                  {alert.message}
                </p>

                {/* Bottom Meta: Plate & Camera */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/70 font-mono">
                  {alert.plate ? (
                    <span className="flex items-center gap-1 text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      <Car size={11} />
                      {alert.plate}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">Diagnostic Event</span>
                  )}

                  <span className="flex items-center gap-1 text-slate-400 group-hover:text-slate-200 transition-colors">
                    <Video size={11} className="text-slate-500" />
                    {alert.cameraId}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-2.5 mt-2 border-t border-slate-800 text-center">
        <Link
          to="/alerts"
          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold font-mono py-1 px-2 rounded hover:bg-cyan-500/10 transition-colors"
        >
          <span>Open Full Incident Log</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}
