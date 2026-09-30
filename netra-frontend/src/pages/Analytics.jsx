import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import TrafficFlowChart from '../components/analytics/TrafficFlowChart'
import AverageSpeedChart from '../components/analytics/AverageSpeedChart'
import TrafficHeatmap from '../components/analytics/TrafficHeatmap'
import CongestionZones from '../components/analytics/CongestionZones'
import CameraNetworkStatus from '../components/analytics/CameraNetworkStatus'
import TrafficInsights from '../components/analytics/TrafficInsights'
import { analyticsKPIs, trafficHeatmapData } from '../data/mockData'
import { 
  Car, 
  Gauge, 
  Activity, 
  AlertTriangle, 
  Video, 
  TrendingUp, 
  TrendingDown, 
  Radio, 
  Clock, 
  BarChart3,
  RefreshCw,
  Sparkles
} from 'lucide-react'

const KPI_ICONS = {
  'kpi-vehicles': Car,
  'kpi-speed': Gauge,
  'kpi-density': Activity,
  'kpi-congestion': AlertTriangle,
  'kpi-cameras': Video,
  'kpi-flow': TrendingUp,
}

const KPI_COLORS = {
  'kpi-vehicles': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  'kpi-speed': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'kpi-density': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  'kpi-congestion': 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  'kpi-cameras': 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  'kpi-flow': 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
}

export default function Analytics() {
  const [lastUpdated, setLastUpdated] = useState('Just now')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdated('Just now')
      setIsRefreshing(false)
    }, 600)
  }

  return (
    <DashboardLayout title="Traffic Intelligence & Analytics">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* ── 1. Analytics Header Section ── */}
        <div className="bg-[#091022]/95 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                  Traffic Analytics
                </h1>
                <span className="text-[10px] bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded font-mono font-bold border border-cyan-500/30 uppercase">
                  MMR URBAN CORRIDOR
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Real-time traffic intelligence across monitored areas
              </p>
            </div>
          </div>

          {/* Right Status & Refresh Pill */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 bg-[#070c18] border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-[11px]">Last updated:</span>
              <span className="text-emerald-400 font-bold">{lastUpdated}</span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070c18] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer text-xs"
              title="Refresh telemetry"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* ── 2. KPI Summary Cards (6 Metrics) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {analyticsKPIs.map((kpi) => {
            const Icon = KPI_ICONS[kpi.id] || Activity
            const colorClass = KPI_COLORS[kpi.id] || 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'

            return (
              <div
                key={kpi.id}
                className="bg-[#091022]/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-150 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 truncate">
                      {kpi.label}
                    </span>
                    <div className={`p-1.5 rounded-lg border ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {kpi.value}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {kpi.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className={`inline-flex items-center gap-0.5 font-bold ${
                    kpi.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {kpi.trend === 'up' ? (
                      <TrendingUp size={11} />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown size={11} />
                    ) : null}
                    {kpi.change}
                  </span>
                  <span className="text-slate-500 truncate max-w-[100px] text-right">
                    {kpi.subtext}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── 3. Dual Charts Grid: Traffic Flow & Average Speed Trend ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrafficFlowChart />
          <AverageSpeedChart />
        </div>

        {/* ── 4. Geographic Traffic Density Heatmap (Full Width) ── */}
        <TrafficHeatmap data={trafficHeatmapData} />

        {/* ── 5. Dual Section: Top Congested Areas + Camera Network Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CongestionZones />
          <CameraNetworkStatus />
        </div>

        {/* ── 6. Traffic Intelligence Insights (4 Cards) ── */}
        <TrafficInsights />

      </div>
    </DashboardLayout>
  )
}
