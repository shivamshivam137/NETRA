import { ShieldAlert, AlertTriangle, Radio, CheckCircle2 } from 'lucide-react'

export default function AlertSummaryCards({ alerts = [] }) {
  const criticalCount = alerts.filter(a => a.severity?.toLowerCase() === 'critical').length
  const highCount = alerts.filter(a => a.severity?.toLowerCase() === 'high').length
  const activeCount = alerts.filter(a => a.status?.toLowerCase() === 'active').length
  const resolvedCount = alerts.filter(a => a.status?.toLowerCase() === 'resolved').length
  const investigatingCount = alerts.filter(a => a.status?.toLowerCase() === 'investigating').length

  const CARDS = [
    {
      id: 'critical',
      label: 'Critical Alerts',
      count: criticalCount,
      subtext: `${criticalCount} immediate response`,
      icon: ShieldAlert,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderGlow: 'hover:border-rose-500/50',
    },
    {
      id: 'high',
      label: 'High Priority',
      count: highCount,
      subtext: `${highCount} elevated threshold`,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderGlow: 'hover:border-amber-500/50',
    },
    {
      id: 'active',
      label: 'Active Incidents',
      count: activeCount,
      subtext: `${investigatingCount} under investigation`,
      icon: Radio,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      borderGlow: 'hover:border-cyan-500/50',
    },
    {
      id: 'resolved',
      label: 'Resolved Events',
      count: resolvedCount,
      subtext: 'Completed in 24h cycle',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      borderGlow: 'hover:border-emerald-500/50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.id}
            className={`bg-[#091022]/95 border border-slate-800 ${card.borderGlow} rounded-xl p-4 sm:p-5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg border ${card.bg} ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 font-mono mt-1">
              <span className="text-3xl font-bold text-white tracking-tight">
                {card.count}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                events
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-slate-400">{card.subtext}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${card.badgeBg}`}>
                Queue
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
