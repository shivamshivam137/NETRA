import { congestionZonesData } from '../../data/mockData'
import { AlertTriangle, MapPin, Gauge, TrendingUp, TrendingDown, ArrowUpRight, Flame } from 'lucide-react'

export default function CongestionZones() {
  return (
    <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Top Congested Areas
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Active bottleneck corridors & urban gridlock rankings</p>
          </div>
        </div>
        <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded font-mono border border-rose-500/20 font-bold">
          {congestionZonesData.length} Identified
        </span>
      </div>

      {/* ── Congestion Rows ── */}
      <div className="space-y-2.5">
        {congestionZonesData.map((zone) => {
          const isCritical = zone.level === 'Critical'
          const isHigh = zone.level === 'High'

          return (
            <div 
              key={zone.id}
              className="bg-[#070c18] hover:bg-[#0c1428] border border-slate-800/90 hover:border-slate-700/90 rounded-lg p-3.5 transition-all duration-150 group font-mono"
            >
              {/* Top Row: Location & Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors">
                      {zone.location}
                    </span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border ${
                      isCritical
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : isHigh
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {zone.level}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans font-normal mt-0.5">
                    {zone.corridor}
                  </div>
                </div>

                {/* Status Pill */}
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isCritical
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                      : isHigh
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80'
                  }`}>
                    {zone.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                    {zone.trendDirection === 'up' ? (
                      <span className="text-rose-400 flex items-center">{zone.trend} <TrendingUp size={10} className="inline ml-0.5" /></span>
                    ) : (
                      <span className="text-emerald-400 flex items-center">{zone.trend} <TrendingDown size={10} className="inline ml-0.5" /></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Density Progress Bar */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Density: <strong className="text-white">{zone.density}%</strong></span>
                  <span>Avg Speed: <strong className={zone.avgSpeed < 20 ? 'text-rose-400' : 'text-emerald-400'}>{zone.avgSpeed} km/h</strong></span>
                  <span className="text-cyan-400 font-bold">{zone.volume} vph</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${zone.density}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
