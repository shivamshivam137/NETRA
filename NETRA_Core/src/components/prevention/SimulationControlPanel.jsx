import { useState, useEffect } from 'react'
import { 
  PRIMARY_INCIDENT, 
  SIMULATION_PHASES 
} from '../../services/trafficPreventionEngine'
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  TrendingDown, 
  Zap, 
  Layers, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Radio,
  SlidersHorizontal,
  Route
} from 'lucide-react'

export default function SimulationControlPanel({
  currentPhase = 1,
  setCurrentPhase,
  isAutoRunning = false,
  setIsAutoRunning,
  onApprove,
  onReject,
  onReset,
}) {
  const currentPhaseObj = SIMULATION_PHASES.find(p => p.phase === currentPhase) || SIMULATION_PHASES[0]
  const isExecuted = currentPhase === 8
  const isAwaitingApproval = currentPhase === 6
  const isExecuting = currentPhase === 7

  // Auto-advancement timer when user hits "▶ RUN PREVENTION SIMULATION"
  useEffect(() => {
    let interval = null
    if (isAutoRunning) {
      interval = setInterval(() => {
        setCurrentPhase((prev) => {
          if (prev >= 5 && prev < 6) {
            // Pause at Phase 6: Awaiting Admin Approval
            setIsAutoRunning(false)
            return 6
          }
          if (prev >= 8) {
            setIsAutoRunning(false)
            return 8
          }
          return prev + 1
        })
      }, 2400)
    }
    return () => clearInterval(interval)
  }, [isAutoRunning, setCurrentPhase, setIsAutoRunning])

  const handleStartSimulation = () => {
    if (currentPhase >= 8) {
      setCurrentPhase(1)
      setIsAutoRunning(true)
    } else {
      setIsAutoRunning(true)
    }
  }

  const handleStepForward = () => {
    if (currentPhase < 8) {
      setCurrentPhase(p => p + 1)
    }
  }

  // Admin status badge determination
  const getStatusBadge = () => {
    if (isExecuted) {
      return { text: 'EXECUTED', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
    }
    if (isExecuting) {
      return { text: 'EXECUTING', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse' }
    }
    if (isAwaitingApproval) {
      return { text: 'PENDING APPROVAL', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-bounce' }
    }
    return { text: 'MONITORING / PENDING', bg: 'bg-slate-800 text-slate-300 border-slate-700' }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="bg-[#091022] border border-slate-800/90 rounded-xl p-5 shadow-xl flex flex-col gap-5">
      {/* ── Header with Simulation Disclaimer ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                AI PREVENTION CONTROL & MASTER SIMULATION
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              8-Phase Proactive Congestion Defense & Simulated Actuation Pipeline
            </p>
          </div>
        </div>

        {/* PROMINENT SIMULATION MODE BADGE (Mandatory) */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/50 text-amber-300 font-mono text-xs font-black tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-amber-500/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>SIMULATION MODE</span>
          </div>
          <span className="hidden md:inline text-[11px] text-slate-400 font-mono">
            (Simulated Controllers)
          </span>
        </div>
      </div>

      {/* ── Section 23: AI PREVENTION CONTROL Summary Card ── */}
      <div className="p-4 rounded-xl bg-[#0b1426] border border-cyan-500/30 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Active Problem */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            ACTIVE PROBLEM
          </span>
          <h3 className="text-sm font-black text-white font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>CAM-003 / JUNCTION A</span>
          </h3>
          <div className="text-xs font-mono text-slate-300 mt-1 space-y-0.5">
            <p>Current: <strong className="text-white">127 vehicles</strong></p>
            <p>Speed: <strong className="text-rose-400">11 km/h</strong></p>
            <p>Congestion: <span className="text-rose-400 font-bold">CRITICAL</span></p>
          </div>
        </div>

        {/* AI Action */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            AI ACTION
          </span>
          <div className="text-xs font-mono text-emerald-300 space-y-1">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Increase green time (30s → 50s)</span>
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Redirect approaching traffic (CAM-002)</span>
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Monitor connected cameras</span>
            </p>
          </div>
        </div>

        {/* Signal Comparison */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            SIGNAL PLAN
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-[#060a14] border border-slate-800">
              <span className="text-slate-500 text-[10px] block">CURRENT SIGNAL</span>
              <strong className="text-slate-300 text-sm">30 sec</strong>
            </div>
            <div className="p-2 rounded bg-[#060a14] border border-emerald-900/50">
              <span className="text-emerald-400 text-[10px] block font-bold">AI SIGNAL</span>
              <strong className="text-emerald-300 text-sm">50 sec</strong>
            </div>
          </div>
        </div>

        {/* Route Comparison */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            CORRIDOR ROUTE
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-[#060a14] border border-slate-800">
              <span className="text-slate-500 text-[10px] block">CURRENT ROUTE</span>
              <strong className="text-rose-400 text-sm">12 min</strong>
            </div>
            <div className="p-2 rounded bg-[#060a14] border border-emerald-900/50">
              <span className="text-emerald-400 text-[10px] block font-bold">ALTERNATE ROUTE</span>
              <strong className="text-emerald-300 text-sm">7 min</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8-Phase Linear Stepper (Section 26) ── */}
      <div className="bg-[#060a14] border border-slate-800/90 rounded-xl p-4">
        {/* Step Title & Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Phase {currentPhase} of 8: {currentPhaseObj.title}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusBadge.bg}`}>
              {statusBadge.text}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400">
              {currentPhaseObj.progress}% Complete
            </span>
          </div>
        </div>

        {/* Main Progress Bar */}
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 mb-3">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${currentPhaseObj.progress}%` }}
          />
        </div>

        {/* Stepper Pills */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-4">
          {SIMULATION_PHASES.map((ph) => {
            const isPassed = currentPhase > ph.phase
            const isCurrent = currentPhase === ph.phase

            return (
              <button
                key={`phase-pill-${ph.phase}`}
                onClick={() => {
                  setIsAutoRunning(false)
                  setCurrentPhase(ph.phase)
                }}
                className={`flex flex-col items-center p-1.5 rounded text-center transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                    : isPassed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  {isPassed ? (
                    <CheckCircle2 size={11} className="text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold">P{ph.phase}</span>
                  )}
                </div>
                <span className="text-[9px] font-mono leading-none truncate max-w-full">
                  {ph.key.replace(/_/g, ' ')}
                </span>
              </button>
            )
          })}
        </div>

        {/* Phase Details Card */}
        <div className="p-3.5 rounded-lg bg-[#0b1426] border border-slate-800">
          <p className="text-xs font-mono text-slate-200 mb-2">
            {currentPhaseObj.message}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            {currentPhaseObj.checks.map((check, i) => (
              <div key={i} className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 25: Admin Approval Action Bar & Master Run Buttons ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#060a14] border border-slate-800">
        {/* Left: Master Run Simulation Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleStartSimulation}
            disabled={isAutoRunning}
            className={`px-4 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              isAutoRunning
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 animate-pulse cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/20'
            }`}
          >
            <Play size={14} className={isAutoRunning ? 'animate-spin' : ''} />
            <span>{isAutoRunning ? 'SIMULATION EXECUTING SEQUENCE...' : '▶ RUN PREVENTION SIMULATION'}</span>
          </button>

          <button
            onClick={handleStepForward}
            disabled={currentPhase >= 8 || isAutoRunning}
            className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <span>Next Phase</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={onReset}
            className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Right: Administrator Approval Gate (Section 25) */}
        <div className="flex items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">
              ADMIN GATEKEEPER
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {isAwaitingApproval ? 'Action Required' : isExecuted ? 'Plan Active' : 'Automated Gate'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onApprove}
              disabled={isExecuted || isExecuting}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isExecuted
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                  : isAwaitingApproval
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse'
                  : 'bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>{isExecuted ? '✓ APPROVED & EXECUTED' : 'APPROVE'}</span>
            </button>

            <button
              onClick={onReject}
              disabled={isExecuted || isExecuting}
              className="px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono text-xs font-semibold border border-rose-800/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <XCircle size={14} />
              <span>REJECT</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 27: BEFORE / AFTER SIMULATED IMPACT CARD ── */}
      {isExecuted && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#061f17] via-[#081829] to-[#061f17] border border-emerald-500/50 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-500/30">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              <h3 className="text-sm font-black text-white font-mono tracking-wide">
                TRAFFIC IMPACT — SIMULATED RESULT
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              SIMULATED RESULT (Proactive Prevention Active)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {/* Vehicles Metric */}
            <div className="p-3 rounded-lg bg-[#060a14] border border-slate-800">
              <span className="text-slate-400 text-[10px] block">VEHICLE COUNT</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-slate-400 line-through text-xs">127</span>
                <span className="text-emerald-400 font-black text-lg">82 vehicles</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                -35% Congestion Reduction
              </span>
            </div>

            {/* Average Speed Metric */}
            <div className="p-3 rounded-lg bg-[#060a14] border border-slate-800">
              <span className="text-slate-400 text-[10px] block">AVERAGE SPEED</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-slate-400 line-through text-xs">11 km/h</span>
                <span className="text-emerald-400 font-black text-lg">22 km/h</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                +100% Velocity Gain
              </span>
            </div>

            {/* Congestion Level */}
            <div className="p-3 rounded-lg bg-[#060a14] border border-slate-800">
              <span className="text-slate-400 text-[10px] block">CONGESTION LEVEL</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-rose-400 line-through text-xs">CRITICAL</span>
                <span className="text-emerald-400 font-black text-base">MODERATE</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Queue cleared from 420m → 110m (REDUCED)
              </span>
            </div>

            {/* Travel Time Metric */}
            <div className="p-3 rounded-lg bg-[#060a14] border border-slate-800">
              <span className="text-slate-400 text-[10px] block">TRAVEL TIME</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-slate-400 line-through text-xs">12 min</span>
                <span className="text-emerald-400 font-black text-lg">7 min</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                5 min Saved via AI Bypass
              </span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center justify-between">
            <span>* Simulated evaluation based on dynamic queue discharge models and multi-corridor load redistribution.</span>
            <span className="text-emerald-400 font-bold">Prevention Strategy Successful</span>
          </div>
        </div>
      )}
    </div>
  )
}
