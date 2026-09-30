import { AlertCircle, Search, Sparkles, RefreshCw } from 'lucide-react'

export default function VehicleNotFound({ query, onReset, samplePlates = ['MH 01 AV 1234', 'MH 04 BT 9876', 'MH 12 AB 3310'] }) {
  return (
    <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-8 text-center shadow-xl flex flex-col items-center justify-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
        <AlertCircle size={28} />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-base font-bold text-white font-mono">
          Vehicle Not Found
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          No records matching <span className="font-mono font-bold text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-900/50">&ldquo;{query}&rdquo;</span> were detected across active ANPR cameras.
        </p>
      </div>

      {/* Hints & suggestions */}
      <div className="bg-[#060a14] border border-slate-800 rounded-lg p-3.5 max-w-md w-full text-left space-y-2 text-xs text-slate-400">
        <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
          Search Tips:
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 font-mono">
          <li>Verify license plate formatting (e.g. <span className="text-cyan-400">MH 01 AV 1234</span>)</li>
          <li>Search is case-insensitive and supports spaces or no spaces</li>
          <li>Ensure vehicle has passed through active camera surveillance zones</li>
        </ul>
      </div>

      {/* Action buttons / quick suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            <span>Reset Search</span>
          </button>
        )}

        {samplePlates && samplePlates.map(plate => (
          <button
            key={plate}
            type="button"
            onClick={() => onReset?.(plate)}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/40 text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles size={11} className="text-cyan-400" />
            <span>Try {plate}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
