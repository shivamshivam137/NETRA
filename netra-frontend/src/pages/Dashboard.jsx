import { 
  Car, 
  Video, 
  AlertTriangle, 
  Gauge, 
  Activity, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Radio
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import StatCard from '../components/dashboard/StatCard'
import MapView from '../components/map/MapView'
import AlertFeed from '../components/alerts/AlertFeed'
import TrafficFlowChart from '../components/analytics/TrafficFlowChart'
import { useLanguage } from '../context/LanguageContext'

export default function Dashboard() {
  const { t } = useLanguage()

  return (
    <DashboardLayout title={t('citySurveillanceOps')}>
      {/* ── 1. Top Statistics Row (6 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t('totalVehicles')}
          value="12,458"
          subtitle={t('detectedToday')}
          icon={Car}
          badgeColor="cyan"
          trend="+14.2%"
          trendType="positive"
        />

        <StatCard
          title={t('activeCameras')}
          value="48 / 52"
          subtitle={`92.3% ${t('operational')}`}
          icon={Video}
          badgeColor="emerald"
          trend={`4 ${t('offline')}`}
          trendType="warning"
        />

        <StatCard
          title={t('activeAlerts')}
          value="07"
          subtitle={`3 ${t('critical')}`}
          icon={AlertTriangle}
          badgeColor="rose"
          trend={t('immediate')}
          trendType="negative"
        />

        <StatCard
          title={t('trafficDensity')}
          value="High"
          subtitle={t('corridor')}
          icon={Activity}
          badgeColor="amber"
          trend={t('peakHours')}
          trendType="warning"
        />

        <StatCard
          title={t('averageSpeed')}
          value="42 km/h"
          subtitle={t('acrossNetwork')}
          icon={Gauge}
          badgeColor="blue"
          trend="-6 km/h"
          trendType="neutral"
        />

        <StatCard
          title={t('congestionZones')}
          value="03"
          subtitle="Sectors 4, 7, 12"
          icon={MapPin}
          badgeColor="rose"
          trend={t('monitored')}
          trendType="warning"
        />
      </div>

      {/* ── 2. Mid Section: GIS Map (2/3 width) & Alert Feed (1/3 width) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView />
        </div>
        <div className="lg:col-span-1">
          <AlertFeed />
        </div>
      </div>

      {/* ── 3. Lower Section: Traffic Flow Chart & Camera Status Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Flow Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <TrafficFlowChart />
        </div>

        {/* Camera Status Summary (1 Col) */}
        <div className="lg:col-span-1 bg-[#091022]/80 backdrop-blur-xs border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Video size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-slate-100">
                    {t('cameraHealthStatus')}
                  </h3>
                  <p className="text-[11px] text-slate-400">{t('anprGridDiagnostics')}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {t('livePolling')}
              </span>
            </div>

            {/* Status bars */}
            <div className="space-y-3">
              {/* Online */}
              <div className="bg-[#070c18] border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <span className="text-xs font-medium text-slate-200">{t('onlineFeeds')}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-emerald-400">48 Units</span>
                  <span className="text-[10px] text-slate-500">(92.3%)</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-[#070c18] border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <span className="text-xs font-medium text-slate-200">{t('warningLatency')}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-amber-400">01 Unit</span>
                  <span className="text-[10px] text-slate-500">(1.9%)</span>
                </div>
              </div>

              {/* Offline */}
              <div className="bg-[#070c18] border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                  <span className="text-xs font-medium text-slate-200">{t('offlineNodes')}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-rose-400">03 Units</span>
                  <span className="text-[10px] text-slate-500">(5.8%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostics quick note */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Radio size={12} className="text-cyan-400 animate-pulse" />
              Auto-failover active
            </span>
            <span className="font-mono text-[11px] text-slate-500">Last scan: 30s ago</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
