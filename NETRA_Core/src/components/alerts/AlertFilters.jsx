import { Search, X, Filter, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function AlertFilters({
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  totalResults,
}) {
  const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low']
  const STATUSES = ['All', 'Active', 'Investigating', 'Resolved']

  return (
    <div className="bg-[#091022]/95 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* ── Top Search Bar & Clear Action ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by vehicle plate, camera ID (e.g. CAM-002), location, or alert type..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#060a14] border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Clear Filters Button & Results Count */}
        <div className="flex items-center justify-between md:justify-end gap-3 font-mono text-xs">
          <span className="text-slate-400">
            Matched: <strong className="text-cyan-400">{totalResults}</strong> events
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer font-semibold shadow-xs"
            >
              <RotateCcw size={12} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Filters Row: Severity & Status Tabs ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-800/80 font-mono text-xs">
        {/* Severity Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-400" />
            Severity:
          </span>
          <div className="flex items-center bg-[#060a14] p-0.5 rounded-lg border border-slate-800 flex-wrap">
            {SEVERITIES.map((sev) => {
              const isSelected = severityFilter.toLowerCase() === sev.toLowerCase()
              let activeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              if (sev === 'Critical') activeColor = 'bg-rose-500/25 text-rose-300 border-rose-500/50'
              if (sev === 'High') activeColor = 'bg-amber-500/25 text-amber-300 border-amber-500/50'
              if (sev === 'Medium') activeColor = 'bg-blue-500/25 text-blue-300 border-blue-500/50'
              if (sev === 'Low') activeColor = 'bg-slate-700/50 text-slate-200 border-slate-600'

              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => onSeverityChange(sev.toLowerCase())}
                  className={`px-2.5 py-1.5 rounded font-semibold transition-colors cursor-pointer border ${
                    isSelected
                      ? `${activeColor} shadow-xs`
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              )
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-400" />
            Status:
          </span>
          <div className="flex items-center bg-[#060a14] p-0.5 rounded-lg border border-slate-800 flex-wrap">
            {STATUSES.map((stat) => {
              const isSelected = statusFilter.toLowerCase() === stat.toLowerCase()
              let activeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              if (stat === 'Active') activeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              if (stat === 'Investigating') activeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              if (stat === 'Resolved') activeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'

              return (
                <button
                  key={stat}
                  type="button"
                  onClick={() => onStatusChange(stat.toLowerCase())}
                  className={`px-2.5 py-1.5 rounded font-semibold transition-colors cursor-pointer border ${
                    isSelected
                      ? `${activeColor} shadow-xs`
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {stat}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
