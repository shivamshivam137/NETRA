import { trafficInsightsData } from '../../data/mockData'
import { Sparkles, TrendingUp, AlertTriangle, Gauge, CheckCircle2, Clock, Zap } from 'lucide-react'

const CATEGORY_ICONS = {
  'Peak Flow': TrendingUp,
  'Critical Hotspot': AlertTriangle,
  'Speed Drop': Gauge,
  'Corridor Optimal': CheckCircle2,
}

const SEVERITY_STYLES = {
  critical: {
    border: 'border-rose-500/30 hover:border-rose-500/50',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  warning: {
    border: 'border-amber-500/30 hover:border-amber-500/50',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  advisory: {
    border: 'border-cyan-500/30 hover:border-cyan-500/50',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  optimal: {
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
}

export default function TrafficInsights() {
  return (
    <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Traffic Insights & Intelligence
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Algorithmic pattern detections across monitored corridors</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 font-mono text-[10px] text-cyan-300">
          <Zap size={11} className="text-cyan-400" />
          <span>Automated Correlator</span>
        </div>
      </div>

      {/* ── Insights Grid (4 Cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {trafficInsightsData.map((item) => {
          const Icon = CATEGORY_ICONS[item.category] || Sparkles
          const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.advisory

          return (
            <div 
              key={item.id}
              className={`bg-[#070c18] border ${style.border} rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-lg group`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${style.badge}`}>
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock size={10} />
                    {item.timestamp}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors leading-snug">
                  {item.title}
                </h4>

                {/* Description */}
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Telemetry Tag */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">{item.id}</span>
                <span className="font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {item.metric}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
