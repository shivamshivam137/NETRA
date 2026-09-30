export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendType = 'neutral', // 'positive', 'negative', 'warning', 'neutral'
  badgeColor = 'cyan', // 'cyan', 'emerald', 'rose', 'amber', 'blue'
}) {
  const colorMap = {
    positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-xs shadow-emerald-500/10',
    negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-xs shadow-rose-500/10',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-xs shadow-amber-500/10',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  }

  const iconBgMap = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 group-hover:bg-cyan-500/20 shadow-sm shadow-cyan-500/10',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 group-hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 group-hover:scale-105 group-hover:bg-rose-500/20 shadow-sm shadow-rose-500/10',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:scale-105 group-hover:bg-amber-500/20 shadow-sm shadow-amber-500/10',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 group-hover:scale-105 group-hover:bg-blue-500/20 shadow-sm shadow-blue-500/10',
  }

  return (
    <div className="group h-full bg-[#091022]/90 backdrop-blur-xs border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5 font-mono">
            {value}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg transition-all duration-200 ${iconBgMap[badgeColor] || iconBgMap.cyan}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-400 truncate pr-1">
          {subtitle || ''}
        </span>
        {trend && (
          <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${colorMap[trendType] || colorMap.neutral}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
