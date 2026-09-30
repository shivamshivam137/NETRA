import { cameras as allCameras } from '../../data/mockData'
import { Video, ShieldCheck, AlertTriangle, XCircle, Radio, Activity } from 'lucide-react'

export default function CameraNetworkStatus() {
  const total = allCameras.length
  const activeCount = allCameras.filter(c => c.status === 'active').length
  const warningCount = allCameras.filter(c => c.status === 'warning').length
  const offlineCount = allCameras.filter(c => c.status === 'offline').length

  const uptimePercent = ((activeCount / total) * 100).toFixed(1)

  return (
    <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Video size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Camera Network Status
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">ANPR visual sensory health & optical link uptime</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{uptimePercent}% Uptime</span>
        </div>
      </div>

      {/* ── 4 Compact Status Metric Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 font-mono">
        {/* Total */}
        <div className="bg-[#070c18] border border-slate-800/90 rounded-lg p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Nodes</span>
          <div className="text-lg font-bold text-white mt-1">{total}</div>
          <span className="text-[9px] text-slate-500">Full Grid</span>
        </div>

        {/* Online */}
        <div className="bg-[#070c18] border border-emerald-500/20 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Online</span>
            <ShieldCheck size={12} className="text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{activeCount}</div>
          <span className="text-[9px] text-emerald-500/80">Operational</span>
        </div>

        {/* Warning */}
        <div className="bg-[#070c18] border border-amber-500/20 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 uppercase font-semibold">Warning</span>
            <AlertTriangle size={12} className="text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 mt-1">{warningCount}</div>
          <span className="text-[9px] text-amber-500/80">High Latency</span>
        </div>

        {/* Offline */}
        <div className="bg-[#070c18] border border-rose-500/20 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-400 uppercase font-semibold">Offline</span>
            <XCircle size={12} className="text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-400 mt-1">{offlineCount}</div>
          <span className="text-[9px] text-rose-500/80">No Signal</span>
        </div>
      </div>

      {/* ── Segmented Grid Distribution Bar ── */}
      <div className="space-y-1.5 mb-3 bg-[#070c18] border border-slate-800/90 rounded-lg p-3">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>Grid Composition</span>
          <span className="text-slate-300 font-bold">{activeCount} Online · {warningCount} Warning · {offlineCount} Offline</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div style={{ width: `${(activeCount / total) * 100}%` }} className="bg-emerald-500 h-full" title="Online" />
          <div style={{ width: `${(warningCount / total) * 100}%` }} className="bg-amber-500 h-full" title="Warning" />
          <div style={{ width: `${(offlineCount / total) * 100}%` }} className="bg-rose-500 h-full" title="Offline" />
        </div>
      </div>

      {/* ── Compact Camera Node Chips ── */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Node Telemetry Status
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {allCameras.map((cam) => {
            const isOnline = cam.status === 'active'
            const isWarning = cam.status === 'warning'
            return (
              <div 
                key={cam.id}
                className="bg-[#060a14] border border-slate-800 rounded p-2 flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <span className="font-bold text-white">{cam.id}</span>
                  <span className="text-slate-500 truncate text-[10px] font-sans">{cam.name}</span>
                </div>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                  isOnline 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : isWarning 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {cam.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
