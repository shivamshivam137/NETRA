import { getPreventionKPIs } from '../../services/trafficPreventionEngine'
import { 
  Camera, 
  Car, 
  AlertOctagon, 
  Sparkles, 
  SlidersHorizontal, 
  Route, 
  Radio, 
  TrendingUp, 
  ShieldAlert,
  Activity,
  Gauge,
  Zap
} from 'lucide-react'

export default function PreventionMetrics({ 
  cameras = [], 
  isExecuted = false, 
  filterCameraId = 'ALL',
  selectedCamera = null 
}) {
  const isFiltered = filterCameraId !== 'ALL' && selectedCamera

  // If filtered to a specific camera, generate 6 focused KPI cards
  const kpis = isFiltered ? [
    {
      id: 'kpi-camera-feed',
      title: 'FILTERED CAMERA',
      value: selectedCamera.id,
      subtext: selectedCamera.name,
      tone: 'cyan',
      badge: selectedCamera.zone || 'MONITORED',
    },
    {
      id: 'kpi-camera-vehicles',
      title: 'CURRENT VEHICLES',
      value: `${selectedCamera.currentVehicles}`,
      subtext: `+${selectedCamera.inflow || 14}/m in · -${selectedCamera.outflow || 12}/m out`,
      tone: 'emerald',
      badge: '● LIVE FEED',
    },
    {
      id: 'kpi-camera-speed',
      title: 'AVERAGE SPEED',
      value: `${selectedCamera.avgSpeed} km/h`,
      subtext: selectedCamera.avgSpeed <= 15 ? 'Crawl Velocity' : selectedCamera.avgSpeed <= 25 ? 'Slow Moving' : 'Free Flowing',
      tone: selectedCamera.avgSpeed <= 15 ? 'rose' : selectedCamera.avgSpeed <= 25 ? 'amber' : 'emerald',
      badge: selectedCamera.density + ' DENSITY',
    },
    {
      id: 'kpi-camera-congestion',
      title: 'CONGESTION STATE',
      value: selectedCamera.congestion,
      subtext: selectedCamera.congestion === 'CRITICAL' ? 'Immediate Bottleneck' : 'Corridor Flowing',
      tone: selectedCamera.congestion === 'CRITICAL' ? 'rose' : selectedCamera.congestion === 'HEAVY' ? 'orange' : selectedCamera.congestion === 'MODERATE' ? 'amber' : 'emerald',
      badge: selectedCamera.action,
    },
    {
      id: 'kpi-camera-signal',
      title: 'AI GREEN SIGNAL',
      value: `${selectedCamera.aiGreen}s`,
      subtext: `Baseline: ${selectedCamera.currentGreen}s (${selectedCamera.delta >= 0 ? `+${selectedCamera.delta}` : selectedCamera.delta}s change)`,
      tone: 'cyan',
      badge: 'PROPOSED SPLIT',
    },
    {
      id: 'kpi-camera-prediction',
      title: 'PREDICTION (10m)',
      value: `${selectedCamera.prediction?.predictedVehicles || selectedCamera.currentVehicles} veh`,
      subtext: selectedCamera.prediction?.text || 'Normal flow expected',
      tone: selectedCamera.prediction?.status === 'EXPECTED' ? 'rose' : selectedCamera.prediction?.status === 'LIKELY' ? 'orange' : 'emerald',
      badge: `${selectedCamera.prediction?.confidence || 90}% CONF`,
    },
  ] : getPreventionKPIs(cameras, isExecuted)

  const getIcon = (id) => {
    switch (id) {
      case 'kpi-active-cameras':
      case 'kpi-camera-feed':
        return Camera
      case 'kpi-current-vehicles':
      case 'kpi-camera-vehicles':
        return Car
      case 'kpi-critical-zones':
      case 'kpi-camera-congestion':
        return AlertOctagon
      case 'kpi-predicted-congestion':
      case 'kpi-camera-prediction':
        return Sparkles
      case 'kpi-signal-optimizations':
      case 'kpi-camera-signal':
        return SlidersHorizontal
      case 'kpi-alternate-routes':
        return Route
      case 'kpi-camera-speed':
        return Gauge
      default:
        return Radio
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const IconComponent = getIcon(kpi.id)

        let borderClass = 'border-slate-800 hover:border-slate-700'
        let textToneClass = 'text-white'
        let iconBgClass = 'bg-slate-800 text-slate-300'
        let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700'

        if (kpi.tone === 'rose') {
          borderClass = 'border-rose-900/50 hover:border-rose-500/50'
          textToneClass = 'text-rose-400'
          iconBgClass = 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        } else if (kpi.tone === 'orange') {
          borderClass = 'border-orange-900/50 hover:border-orange-500/50'
          textToneClass = 'text-orange-400'
          iconBgClass = 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
          badgeClass = 'bg-orange-500/20 text-orange-300 border-orange-500/40'
        } else if (kpi.tone === 'emerald') {
          borderClass = 'border-emerald-900/50 hover:border-emerald-500/50'
          textToneClass = 'text-emerald-400'
          iconBgClass = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        } else if (kpi.tone === 'amber') {
          borderClass = 'border-amber-900/50 hover:border-amber-500/50'
          textToneClass = 'text-amber-400'
          iconBgClass = 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        } else if (kpi.tone === 'cyan') {
          borderClass = 'border-cyan-900/50 hover:border-cyan-500/50'
          textToneClass = 'text-cyan-400'
          iconBgClass = 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
          badgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
        }

        return (
          <div
            key={kpi.id}
            className={`p-3.5 rounded-xl bg-[#091022] border ${borderClass} shadow-lg transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider truncate">
                {kpi.title}
              </span>
              <div className={`p-1 rounded-lg ${iconBgClass}`}>
                <IconComponent size={13} />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-1 my-1">
              <span className={`text-xl font-black font-mono tracking-tight ${textToneClass} truncate`}>
                {kpi.value}
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeClass} shrink-0 truncate max-w-[95px]`}>
                {kpi.badge}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
              {kpi.subtext}
            </div>
          </div>
        )
      })}
    </div>
  )
}
