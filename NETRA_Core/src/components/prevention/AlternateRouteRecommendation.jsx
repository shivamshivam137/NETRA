import { PRIMARY_INCIDENT } from '../../services/trafficPreventionEngine'
import { 
  Route, 
  ArrowRight, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  MapPin, 
  Compass, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

export default function AlternateRouteRecommendation({ isExecuted = false }) {
  const routePlan = PRIMARY_INCIDENT.routePlan
  const currentRoute = routePlan.currentRoute
  const altRoute = routePlan.alternateRoute

  return (
    <div className="bg-[#091022] border border-slate-800/90 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
      {/* ── Section Header ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Route size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  🛣 AI PREDICTIVE ALTERNATE ROUTE
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {altRoute.timeSavedMinutes}m Time Saved
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {routePlan.originName} → {routePlan.destinationName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 border ${
              isExecuted
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}>
              <Compass size={13} />
              <span>{isExecuted ? 'DIVERSION ACTIVE' : 'BYPASS READY'}</span>
            </span>
          </div>
        </div>

        {/* ── Side-by-Side Comparison: Current Route vs Alternate Route (Section 20) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Current Congested Route (Route A) */}
          <div className="p-4 rounded-xl bg-[#0b1426] border border-rose-900/40 relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold text-rose-300 font-mono">
                    ROUTE A — CURRENT PATH
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  🔴 CRITICAL
                </span>
              </div>

              {/* Corridor Sequence */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300 mb-3 bg-[#060a14] p-2 rounded-lg border border-slate-800">
                <span>CAM-001</span>
                <ChevronRight size={13} className="text-rose-400" />
                <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                  CAM-003 (Gridlock)
                </span>
                <ChevronRight size={13} className="text-rose-400" />
                <span>CAM-005</span>
              </div>

              {/* Telemetry and Prediction */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Current ETA</span>
                  <span className="text-white font-bold text-base">12 min</span>
                </div>
                <div className="bg-[#060a14] p-2 rounded border border-rose-950">
                  <span className="text-rose-400 text-[10px] block">Predicted ETA</span>
                  <span className="text-rose-300 font-bold text-base">15 min</span>
                  <span className="text-[9px] text-rose-500 block">Critical Risk</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span>Avg Speed: <strong className="text-rose-400">11 km/h</strong></span>
              <span>Distance: 18.4 km</span>
            </div>
          </div>

          {/* AI Recommended Route (Route B) */}
          <div className="p-4 rounded-xl bg-[#0b1426] border border-emerald-500/50 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-emerald-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-400" />
                    <span>ROUTE B — AI BYPASS</span>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  🟢 MODERATE
                </span>
              </div>

              {/* Corridor Sequence */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300 mb-3 bg-[#060a14] p-2 rounded-lg border border-slate-800">
                <span>CAM-001</span>
                <ChevronRight size={13} className="text-emerald-400" />
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  CAM-002 (Bypass)
                </span>
                <ChevronRight size={13} className="text-emerald-400" />
                <span>CAM-005</span>
              </div>

              {/* Telemetry and Prediction */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Current ETA</span>
                  <span className="text-emerald-300 font-bold text-base">7 min</span>
                </div>
                <div className="bg-[#060a14] p-2 rounded border border-emerald-950">
                  <span className="text-emerald-400 text-[10px] block">Predicted ETA</span>
                  <span className="text-emerald-300 font-bold text-base">8 min</span>
                  <span className="text-[9px] text-emerald-400 block">Moderate Flow</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-emerald-300 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span>Avg Speed: <strong className="text-white">28 km/h</strong></span>
              <span className="font-bold">5 min Saved (42% Faster)</span>
            </div>
          </div>
        </div>

        {/* ── Section 22: PREDICTION-AWARE ROUTING EXPLANATION ── */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#060a14] border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5 text-[11px] uppercase">
              <Compass size={14} />
              <span>PREDICTION-AWARE ROUTE DECISION MATRIX</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              AI SELECTS ROUTE B
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Route A will degrade from 12 min to 15 min as trajectory influx from CAM-001 hits CAM-003. Route B traverses Sion Circle (CAM-002) with 28 km/h free velocity, preventing corridor gridlock before congestion manifests.
          </p>
          <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>🗺 Drawn on GIS Map: <strong className="text-rose-400">RED LINE</strong> (Route A) vs <strong className="text-emerald-400">GREEN LINE</strong> (Route B)</span>
            <span>Real Coordinates Applied</span>
          </div>
        </div>
      </div>
    </div>
  )
}
