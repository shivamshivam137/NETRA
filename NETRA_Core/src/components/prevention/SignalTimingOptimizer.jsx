import { useState, useEffect } from 'react'
import { PRIMARY_INCIDENT } from '../../services/trafficPreventionEngine'
import { 
  SlidersHorizontal, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Activity, 
  Zap, 
  Play, 
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Radio
} from 'lucide-react'

export default function SignalTimingOptimizer({ 
  isExecuted = false, 
  isExecuting = false, 
  selectedCamera = null 
}) {
  const signalPlan = PRIMARY_INCIDENT.signalPlan
  const why = signalPlan.whyDecision

  // Dynamic Camera / Junction Mapping
  const activeCameraId = selectedCamera?.id || 'CAM-003'
  const activeJunction = selectedCamera ? `${selectedCamera.id} / ${selectedCamera.junction}` : signalPlan.junction
  
  // Timing parameters
  const currentGreenNS = selectedCamera?.currentGreen || 30
  const proposedGreenNS = selectedCamera?.aiGreen || 50
  const deltaNS = selectedCamera?.delta !== undefined ? selectedCamera.delta : 20

  const currentGreenEW = 30
  const proposedGreenEW = Math.max(10, 60 - proposedGreenNS)
  const deltaEW = proposedGreenEW - currentGreenEW

  // Dynamic cycle timer simulation (60s total cycle)
  const totalCycle = 60
  const [cycleSeconds, setCycleSeconds] = useState(0)

  // Simulation active signal duration:
  const isInterventionActive = isExecuted || isExecuting
  const nsGreenLimit = isInterventionActive ? proposedGreenNS : currentGreenNS
  const ewGreenLimit = isInterventionActive ? proposedGreenEW : currentGreenEW

  useEffect(() => {
    const timer = setInterval(() => {
      setCycleSeconds((prev) => (prev + 1) % totalCycle)
    }, 1000)
    return () => clearInterval(timer)
  }, [totalCycle])

  // Current active phase
  const isNSActive = cycleSeconds < nsGreenLimit
  const nsCountdown = isNSActive ? (nsGreenLimit - cycleSeconds) : 0
  const ewCountdown = !isNSActive ? (totalCycle - cycleSeconds) : 0

  return (
    <div className="bg-[#091022] border border-slate-800/90 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
      {/* ── Section Header ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  🚦 SMART SIGNAL OPTIMIZATION & SIMULATION
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  SIMULATION ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {activeJunction} · Dynamic Green Phase Allocation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 border ${
              isExecuted
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : isExecuting
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}>
              {isExecuted ? <CheckCircle2 size={13} /> : <Zap size={13} />}
              <span>{isExecuted ? `AI PLAN ACTIVE (${proposedGreenNS}s / ${proposedGreenEW}s)` : isExecuting ? 'ACTUATING CONTROLLER...' : 'AI PLAN PROPOSED'}</span>
            </span>
          </div>
        </div>

        {/* ── Signal Simulation Indicator & Live Countdown (Section 18) ── */}
        <div className="mt-4 p-4 rounded-xl bg-[#060a14] border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-cyan-400" />
              <span className="text-xs font-mono text-slate-300">
                Cycle Progression: <strong className="text-white">{cycleSeconds}s</strong> / {totalCycle}s
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {isInterventionActive ? 'Dynamic AI Schedule' : 'Fixed Baseline Schedule'}
              </span>
            </div>

            <div className="text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Current Active Axis:</span>
              <strong className={isNSActive ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {isNSActive ? 'NORTH-SOUTH (🟢 GREEN)' : 'EAST-WEST (🟢 GREEN)'}
              </strong>
            </div>
          </div>

          {/* Dual Progress Bar for Cycle */}
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 relative mb-2">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                isNSActive ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${(cycleSeconds / totalCycle) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>0s (Start)</span>
            <span className="text-emerald-400 font-semibold">
              NS Split: {nsGreenLimit}s
            </span>
            <span className="text-amber-400 font-semibold">
              EW Split: {ewGreenLimit}s
            </span>
            <span>60s (Loop)</span>
          </div>
        </div>

        {/* ── Visible Signal Simulation Cards (North-South vs East-West) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* 🚦 NORTH-SOUTH AXIS */}
          <div className={`p-4 rounded-xl bg-[#0b1426] border transition-all ${
            isNSActive ? 'border-emerald-500/70 shadow-lg shadow-emerald-500/10' : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Traffic Light Head */}
                <div className="w-6 h-14 rounded-lg bg-slate-950 border border-slate-700 p-1 flex flex-col items-center justify-between">
                  <div className={`w-3 h-3 rounded-full ${!isNSActive ? 'bg-rose-500 shadow-sm shadow-rose-500' : 'bg-rose-950'}`} />
                  <div className="w-3 h-3 rounded-full bg-amber-950" />
                  <div className={`w-3 h-3 rounded-full ${isNSActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-emerald-950'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                    <span>🚦 NORTH-SOUTH</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeCameraId} Arterial Corridor
                  </span>
                </div>
              </div>

              {/* Countdown badge */}
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">COUNTDOWN</span>
                <span className={`text-2xl font-black font-mono ${isNSActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {isNSActive ? `${nsCountdown}s` : 'STOP'}
                </span>
              </div>
            </div>

            {/* Current vs AI Plan Comparison */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="bg-[#060a14] p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">CURRENT SIGNAL</span>
                <span className="text-slate-300 font-bold text-base block mt-0.5">🟢 {currentGreenNS} sec</span>
                <span className="text-[10px] text-slate-500">Static Timing</span>
              </div>
              <div className="bg-[#060a14] p-2.5 rounded-lg border border-emerald-500/50 bg-emerald-950/20">
                <span className="text-emerald-400 text-[10px] block font-bold">AI RECOMMENDED</span>
                <span className="text-emerald-300 font-black text-base block mt-0.5">🟢 {proposedGreenNS} sec</span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={12} />
                  {currentGreenNS}s → {proposedGreenNS}s ({deltaNS >= 0 ? `+${deltaNS}` : deltaNS} sec)
                </span>
              </div>
            </div>

            {/* Corridor Telemetry */}
            <div className="p-2 rounded bg-[#060a14] text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Traffic Load: <strong className="text-white">{selectedCamera?.currentVehicles || 127} vehicles</strong></span>
              <span>Speed: <strong className={selectedCamera?.avgSpeed <= 15 ? 'text-rose-400' : 'text-emerald-400'}>{selectedCamera?.avgSpeed || 11} km/h</strong></span>
            </div>
          </div>

          {/* 🚦 EAST-WEST AXIS */}
          <div className={`p-4 rounded-xl bg-[#0b1426] border transition-all ${
            !isNSActive ? 'border-amber-500/70 shadow-lg shadow-amber-500/10' : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Traffic Light Head */}
                <div className="w-6 h-14 rounded-lg bg-slate-950 border border-slate-700 p-1 flex flex-col items-center justify-between">
                  <div className={`w-3 h-3 rounded-full ${isNSActive ? 'bg-rose-500 shadow-sm shadow-rose-500' : 'bg-rose-950'}`} />
                  <div className="w-3 h-3 rounded-full bg-amber-950" />
                  <div className={`w-3 h-3 rounded-full ${!isNSActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-emerald-950'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                    <span>🚦 EAST-WEST</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Cross-Street Feeder Link
                  </span>
                </div>
              </div>

              {/* Countdown badge */}
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">COUNTDOWN</span>
                <span className={`text-2xl font-black font-mono ${!isNSActive ? 'text-amber-400' : 'text-slate-600'}`}>
                  {!isNSActive ? `${ewCountdown}s` : 'STOP'}
                </span>
              </div>
            </div>

            {/* Current vs AI Plan Comparison */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="bg-[#060a14] p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">CURRENT SIGNAL</span>
                <span className="text-slate-300 font-bold text-base block mt-0.5">🟢 {currentGreenEW} sec</span>
                <span className="text-[10px] text-slate-500">Static Timing</span>
              </div>
              <div className="bg-[#060a14] p-2.5 rounded-lg border border-cyan-500/50 bg-cyan-950/20">
                <span className="text-cyan-400 text-[10px] block font-bold">AI RECOMMENDED</span>
                <span className="text-cyan-300 font-black text-base block mt-0.5">🟢 {proposedGreenEW} sec</span>
                <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-0.5">
                  <ArrowDownRight size={12} />
                  {currentGreenEW}s → {proposedGreenEW}s ({deltaEW >= 0 ? `+${deltaEW}` : deltaEW} sec)
                </span>
              </div>
            </div>

            {/* Corridor Telemetry */}
            <div className="p-2 rounded bg-[#060a14] text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Traffic Load: <strong className="text-white">{Math.round((selectedCamera?.currentVehicles || 127) * 0.35)} vehicles</strong></span>
              <span>Speed: <strong className="text-emerald-400">{Math.min(45, (selectedCamera?.avgSpeed || 11) + 16)} km/h</strong></span>
            </div>
          </div>
        </div>

        {/* ── Section 19: WHY DID AI CHANGE THE SIGNAL? ── */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#0a1426] to-[#070e1c] border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={16} className="text-cyan-400" />
            <span className="text-xs font-bold text-white font-mono tracking-wider uppercase">
              WHY THIS DECISION FOR {activeCameraId}?
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-3">
            <div className="p-2 rounded bg-[#060a14] border border-slate-800">
              <span className="text-slate-500 text-[10px] block">North-South Load</span>
              <strong className="text-rose-400 text-sm">{selectedCamera?.currentVehicles || 127} veh</strong>
            </div>
            <div className="p-2 rounded bg-[#060a14] border border-slate-800">
              <span className="text-slate-500 text-[10px] block">East-West Load</span>
              <strong className="text-emerald-400 text-sm">{Math.round((selectedCamera?.currentVehicles || 127) * 0.35)} veh</strong>
            </div>
            <div className="p-2 rounded bg-[#060a14] border border-slate-800">
              <span className="text-slate-500 text-[10px] block">North-South Speed</span>
              <strong className="text-rose-400 text-sm">{selectedCamera?.avgSpeed || 11} km/h</strong>
            </div>
            <div className="p-2 rounded bg-[#060a14] border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Predicted Inflow</span>
              <strong className="text-cyan-400 text-sm">{selectedCamera?.prediction?.predictedVehicles || 145} veh</strong>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 space-y-1 bg-[#060a14]/60 p-2.5 rounded border border-slate-800/80">
            <p>
              <strong className="text-cyan-300">Corridor Rationale: </strong>
              "{selectedCamera?.prediction?.cause || why.decisionText}"
            </p>
            <p>
              <strong className="text-emerald-300">Phase Allocation: </strong>
              "North-South green configured at {proposedGreenNS}s ({deltaNS >= 0 ? `+${deltaNS}` : deltaNS}s) vs East-West green at {proposedGreenEW}s ({deltaEW >= 0 ? `+${deltaEW}` : deltaEW}s)."
            </p>
            <p>
              <strong className="text-amber-300">Prevention Objective: </strong>
              "{selectedCamera?.prediction?.prevention || why.expectedPurpose}"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
