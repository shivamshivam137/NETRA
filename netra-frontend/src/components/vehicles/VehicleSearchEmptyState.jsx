import { Car, Search, ShieldCheck, MapPin, Activity, Sparkles, Video } from 'lucide-react'

export default function VehicleSearchEmptyState({ onSelectPlate, samplePlates = ['MH 01 AV 1234', 'MH 04 BT 9876', 'MH 12 AB 3310', 'MH 43 DK 5541'] }) {
  return (
    <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-8 sm:p-10 text-center shadow-xl flex flex-col items-center justify-center space-y-6">
      {/* Icon cluster */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-500/10">
          <Car size={32} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center">
          <Search size={12} />
        </div>
      </div>

      {/* Main explanation */}
      <div className="max-w-md space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
          NETRA Vehicle Intelligence Search
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Enter any vehicle license plate in the search bar above to look up real-time telemetry, camera detection history, current status, and route trajectory data across the city network.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full text-left">
        <div className="bg-[#060a14] border border-slate-800/90 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-semibold">
            <Video size={13} />
            <span>ANPR Detection</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Instant plate matching across 52 optical sensor nodes
          </p>
        </div>

        <div className="bg-[#060a14] border border-slate-800/90 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-semibold">
            <Activity size={13} />
            <span>Telemetry History</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Timestamped sightings, speeds, and timestamps
          </p>
        </div>

        <div className="bg-[#060a14] border border-slate-800/90 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono font-semibold">
            <ShieldCheck size={13} />
            <span>Threat Flagging</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Automated hotlist & speed violation alerts
          </p>
        </div>
      </div>

      {/* Quick Select Buttons */}
      {samplePlates && samplePlates.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
            <Sparkles size={12} className="text-cyan-400" />
            Quick search targets:
          </span>
          {samplePlates.map(plate => (
            <button
              key={plate}
              type="button"
              onClick={() => onSelectPlate?.(plate)}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              {plate}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
