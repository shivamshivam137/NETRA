import { 
  ShieldAlert, 
  AlertTriangle, 
  Car, 
  Video, 
  MapPin, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Radio, 
  RotateCcw,
  Search,
  FilterX
} from 'lucide-react'

const SEVERITY_CONFIG = {
  critical: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    iconColor: 'text-rose-400',
    dot: 'bg-rose-400',
    borderLeft: 'border-l-rose-500',
  },
  high: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    iconColor: 'text-amber-400',
    dot: 'bg-amber-400',
    borderLeft: 'border-l-amber-500',
  },
  medium: {
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    dot: 'bg-cyan-400',
    borderLeft: 'border-l-cyan-500',
  },
  low: {
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    iconColor: 'text-slate-400',
    dot: 'bg-slate-400',
    borderLeft: 'border-l-slate-600',
  },
}

const STATUS_CONFIG = {
  active: {
    badge: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
    dot: 'bg-rose-400 animate-pulse',
  },
  investigating: {
    badge: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    dot: 'bg-amber-400 animate-pulse',
  },
  resolved: {
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    dot: 'bg-emerald-400',
  },
}

export default function AlertList({ 
  alerts = [], 
  onSelectAlert, 
  onResetFilters 
}) {
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A'
    const d = new Date(isoString)
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST`
  }

  // ─── Empty State ─────────────────────────────────────────────────────────────
  if (alerts.length === 0) {
    return (
      <div className="bg-[#091022]/95 border border-slate-800 rounded-xl p-10 sm:p-14 shadow-2xl text-center flex flex-col items-center justify-center space-y-4 font-mono">
        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 shadow-inner">
          <FilterX size={36} className="text-slate-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
            No Alerts Found
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-1 max-w-md mx-auto">
            No incident records matched your active search query or filter criteria. Try adjusting your parameters.
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw size={13} />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#091022]/95 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0">
      {/* ── Table Header Bar ── */}
      <div className="p-4 bg-[#070c18] border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-cyan-400" />
          <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
            Incident Telemetry Feed ({alerts.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Click any event to inspect full telemetry & dispatch
        </span>
      </div>

      {/* ── Desktop Table Layout ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#060a14] border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-3.5">Severity</th>
              <th className="p-3.5">Alert Type</th>
              <th className="p-3.5">Target Vehicle</th>
              <th className="p-3.5">Sensor Node</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {alerts.map((alert) => {
              const sevKey = alert.severity?.toLowerCase() || 'medium'
              const statKey = alert.status?.toLowerCase() || 'active'
              const sevStyle = SEVERITY_CONFIG[sevKey] || SEVERITY_CONFIG.medium
              const statStyle = STATUS_CONFIG[statKey] || STATUS_CONFIG.active

              return (
                <tr
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  className={`hover:bg-[#0c1428] transition-colors cursor-pointer border-l-3 ${sevStyle.borderLeft}`}
                >
                  {/* Severity */}
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${sevStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sevStyle.dot}`} />
                      {alert.severity}
                    </span>
                  </td>

                  {/* Alert Type */}
                  <td className="p-3.5 font-bold text-white">
                    <div>{alert.type}</div>
                    <div className="text-[10px] font-mono text-slate-400 font-normal">{alert.id}</div>
                  </td>

                  {/* Vehicle */}
                  <td className="p-3.5 font-mono">
                    {alert.vehiclePlate || alert.plate ? (
                      <span className="inline-flex items-center gap-1 bg-cyan-950/70 text-cyan-200 px-2 py-0.5 rounded border border-cyan-800/50 text-[11px] font-bold shadow-xs">
                        <Car size={11} className="text-cyan-400" />
                        {alert.vehiclePlate || alert.plate}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">System Grid</span>
                    )}
                  </td>

                  {/* Camera */}
                  <td className="p-3.5 font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <Video size={12} className="text-slate-500" />
                      <strong className="text-white">{alert.cameraId}</strong>
                    </span>
                  </td>

                  {/* Location */}
                  <td className="p-3.5 text-slate-300 text-[11px] max-w-[200px] truncate">
                    {alert.location || 'Mumbai MMR'}
                  </td>

                  {/* Time */}
                  <td className="p-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {formatTime(alert.timestamp)}
                  </td>

                  {/* Status */}
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${statStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statStyle.dot}`} />
                      {alert.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-right font-mono">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAlert(alert)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40"
                    >
                      <span>Inspect</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile / Tablet Stacked Cards Layout ── */}
      <div className="block lg:hidden divide-y divide-slate-800/80 p-3 space-y-3">
        {alerts.map((alert) => {
          const sevKey = alert.severity?.toLowerCase() || 'medium'
          const statKey = alert.status?.toLowerCase() || 'active'
          const sevStyle = SEVERITY_CONFIG[sevKey] || SEVERITY_CONFIG.medium
          const statStyle = STATUS_CONFIG[statKey] || STATUS_CONFIG.active

          return (
            <div
              key={`mobile-${alert.id}`}
              onClick={() => onSelectAlert(alert)}
              className={`bg-[#070c18] hover:bg-[#0c1428] border border-slate-800/90 rounded-xl p-4 transition-colors cursor-pointer space-y-3 border-l-4 ${sevStyle.borderLeft}`}
            >
              {/* Top Row: Severity, Type, ID */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${sevStyle.badge}`}>
                      {alert.severity}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${statStyle.badge}`}>
                      {alert.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {alert.type}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">{alert.id}</span>
                </div>

                <button
                  type="button"
                  className="text-cyan-400 flex items-center gap-1 text-xs font-mono font-bold"
                >
                  <span>Inspect</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Middle Row: Vehicle & Camera */}
              <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                {alert.vehiclePlate || alert.plate ? (
                  <span className="inline-flex items-center gap-1 bg-cyan-950/80 text-cyan-200 px-2 py-0.5 rounded border border-cyan-800 text-[11px] font-bold">
                    <Car size={11} className="text-cyan-400" />
                    {alert.vehiclePlate || alert.plate}
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">System Grid Event</span>
                )}
                <span className="text-slate-400 flex items-center gap-1">
                  <Video size={11} className="text-amber-400" />
                  {alert.cameraId}
                </span>
              </div>

              {/* Bottom Row: Location & Timestamp */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                <span className="truncate max-w-[200px]">{alert.location}</span>
                <span>{formatTime(alert.timestamp)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
