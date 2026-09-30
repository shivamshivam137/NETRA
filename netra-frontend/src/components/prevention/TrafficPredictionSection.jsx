import { useMemo } from 'react'
import { 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Gauge, 
  Activity, 
  ShieldAlert, 
  Zap, 
  ArrowRight,
  Info,
  Radio
} from 'lucide-react'
import { 
  UPCOMING_TRAFFIC_RISKS, 
  NEXT_10_MINUTES_TIMELINE, 
  getCameraPredictionCurve 
} from '../../services/trafficPreventionEngine'

export default function TrafficPredictionSection({ 
  selectedCamera, 
  filterCameraId = 'ALL',
  onSelectCamera = () => {} 
}) {
  const cam = selectedCamera || {
    id: 'CAM-003',
    name: 'Vashi Bridge Toll Plaza',
    junction: 'Junction A / Intermodal',
    zone: 'Navi Mumbai Entry',
    currentVehicles: 127,
    avgSpeed: 11,
    density: 'VERY HIGH',
    congestion: 'CRITICAL',
    inflow: 28,
    outflow: 11,
    prediction: {
      status: 'EXPECTED',
      level: 'CRITICAL',
      text: 'Critical congestion expected in 7 min',
      minutes: 7,
      predictedVehicles: 145,
      predictedSpeed: 9,
      confidence: 87,
      cause: 'Increasing inflow (28/min) + incoming trajectory flow from CAM-001/CAM-002',
      prevention: 'Signal Timing (+20s) + Alternate Route Diversion',
    },
  }

  // Filtered timeline according to active camera filter
  const filteredTimeline = useMemo(() => {
    if (filterCameraId === 'ALL') return NEXT_10_MINUTES_TIMELINE
    const matches = NEXT_10_MINUTES_TIMELINE.filter(item => item.cameraId === filterCameraId)
    if (matches.length > 0) return matches
    return [
      { minute: 0, label: 'NOW', cameraId: cam.id, status: cam.congestion, message: `Current telemetry at ${cam.id}: ${cam.currentVehicles} veh at ${cam.avgSpeed} km/h` },
      { minute: 5, label: '5 min', cameraId: cam.id, status: cam.prediction?.level || 'NORMAL', message: `Midway forecast: ${Math.round((cam.currentVehicles + (cam.prediction?.predictedVehicles || cam.currentVehicles)) / 2)} vehicles projected` },
      { minute: 10, label: '10 min', cameraId: cam.id, status: cam.prediction?.level || 'NORMAL', message: `Horizon prediction: ${cam.prediction?.predictedVehicles || cam.currentVehicles} vehicles (${cam.prediction?.confidence || 90}% confidence)` },
    ]
  }, [filterCameraId, cam])

  // Filtered risks according to active camera filter
  const filteredRisks = useMemo(() => {
    if (filterCameraId === 'ALL') return UPCOMING_TRAFFIC_RISKS
    const matches = UPCOMING_TRAFFIC_RISKS.filter(r => r.cameraId === filterCameraId)
    if (matches.length > 0) return matches
    return [
      {
        id: `RISK-${cam.id}`,
        cameraId: cam.id,
        cameraName: cam.name,
        level: cam.prediction?.level || 'NORMAL',
        title: cam.prediction?.text || 'Normal conditions maintained',
        confidence: cam.prediction?.confidence || 90,
        currentVehicles: cam.currentVehicles,
        predictedVehicles: cam.prediction?.predictedVehicles || cam.currentVehicles,
        speed: cam.avgSpeed,
        minutes: cam.prediction?.minutes || 10,
      }
    ]
  }, [filterCameraId, cam])

  // Calculate prediction curve data points (Actual vs Predicted)
  const curveData = useMemo(() => getCameraPredictionCurve(cam), [cam])

  // Min and max for chart normalization
  const maxCount = Math.max(...curveData.map(d => d.count), 150)
  const minCount = Math.max(0, Math.min(...curveData.map(d => d.count)) - 20)

  // Prediction status indicator
  const getStatusBanner = (status) => {
    switch (status) {
      case 'EXPECTED':
        return {
          icon: AlertTriangle,
          text: '🔴 CONGESTION EXPECTED',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/20',
          dot: 'bg-rose-400',
        }
      case 'LIKELY':
        return {
          icon: AlertTriangle,
          text: '🟠 CONGESTION LIKELY',
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
          dot: 'bg-orange-400',
        }
      case 'POSSIBLE':
        return {
          icon: Activity,
          text: '🟡 POSSIBLE CONGESTION',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          dot: 'bg-amber-400',
        }
      default:
        return {
          icon: CheckCircle2,
          text: '🟢 NO CONGESTION EXPECTED',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          dot: 'bg-emerald-400',
        }
    }
  }

  const statusInfo = getStatusBanner(cam.prediction?.status)
  const vehicleDelta = (cam.prediction?.predictedVehicles || cam.currentVehicles) - cam.currentVehicles

  return (
    <div className="bg-[#091022] border border-slate-800/90 rounded-xl p-5 shadow-xl space-y-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono tracking-wide">
              TRAFFIC PREDICTION & 10-MINUTE HORIZON
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Explainable AI Forecasting · Trajectory Inflow Projections · Ahead-of-Time Congestion Detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span>PREDICTIVE ENGINE ACTIVE</span>
          </span>
        </div>
      </div>

      {/* ── 3-Column Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Col 1: Visual Prediction Card for Selected Camera (Sections 9, 10, 14) ── */}
        <div className="rounded-xl bg-[#060a14] border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header Badge & Selected Camera Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  SELECTED NODE TELEMETRY
                </span>
                <span className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                  <span>{cam.id}</span>
                  <span className="text-slate-400 font-normal">·</span>
                  <span className="text-cyan-400 text-xs truncate max-w-[170px]">{cam.name}</span>
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {cam.junction}
              </span>
            </div>

            {/* Current Telemetry Subcard */}
            <div className="p-3 rounded-lg bg-[#0b1426] border border-slate-800 mb-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                [ACTUAL DATA] CURRENT STATE
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Vehicles</span>
                  <span className="text-white font-bold text-base">{cam.currentVehicles}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Speed</span>
                  <span className="text-cyan-400 font-bold text-base">{cam.avgSpeed} km/h</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Density</span>
                  <span className="text-amber-400 font-bold text-xs">{cam.density}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-2 pt-1.5 border-t border-slate-800/60">
                <span>Inflow: <strong className="text-emerald-400">+{cam.inflow || 18}/min</strong></span>
                <span>·</span>
                <span>Outflow: <strong className="text-cyan-400">-{cam.outflow || 11}/min</strong></span>
              </div>
            </div>

            {/* 🔮 Prediction Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#11192d] to-[#0a1122] border border-cyan-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>🔮 AI PREDICTION</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusInfo.bg}`}>
                  {statusInfo.text}
                </span>
              </div>

              {/* Expected In Pill */}
              <div className="bg-[#060a14] p-2.5 rounded-lg border border-slate-800/90 text-xs font-mono">
                <div className="text-slate-400 text-[11px] mb-1">
                  ⏱ Expected Timeline:
                </div>
                <div className="text-white font-bold text-sm">
                  {cam.prediction?.minutes ? (
                    <span>In approximately <strong className="text-rose-400">{cam.prediction.minutes} minutes</strong></span>
                  ) : (
                    <span className="text-emerald-400">No congestion predicted</span>
                  )}
                </div>
              </div>

              {/* Predicted Vehicles & Speed (Actual vs Predicted) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Predicted in 10 min</span>
                  <span className="text-amber-300 font-bold text-sm">
                    {cam.prediction?.predictedVehicles || cam.currentVehicles} veh
                  </span>
                  <span className="text-[10px] text-rose-400 block font-bold">
                    {vehicleDelta > 0 ? `+${vehicleDelta} vehicles` : `${vehicleDelta} vehicles`}
                  </span>
                </div>
                <div className="bg-[#060a14] p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Predicted Speed</span>
                  <span className="text-rose-400 font-bold text-sm">
                    {cam.prediction?.predictedSpeed || cam.avgSpeed} km/h
                  </span>
                  <span className="text-[10px] text-cyan-400 block">
                    Confidence: <strong>{cam.prediction?.confidence || 87}%</strong>
                  </span>
                </div>
              </div>

              {/* Cause & Prevention */}
              <div className="text-[11px] font-mono bg-[#060a14] p-2.5 rounded border border-slate-800/80 space-y-1">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Root Cause:
                  </span>
                  <span className="text-slate-300">
                    {cam.prediction?.cause || 'Steady multi-lane traffic without bottleneck'}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-800/60">
                  <span className="text-cyan-400 block font-semibold text-[10px] uppercase">
                    Recommended Prevention:
                  </span>
                  <span className="text-emerald-300">
                    {cam.prediction?.prevention || 'Signal Timing + Alternate Route Diversion'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Col 2: Next 10 Minutes Visual Timeline (Section 11) ── */}
        <div className="rounded-xl bg-[#060a14] border border-slate-800 p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono tracking-wide">
                  NEXT 10 MINUTES TIMELINE
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                Forward Horizon
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-4">
              Upcoming predicted traffic events across city corridors:
            </p>

            {/* Vertical Visual Timeline Tree */}
            <div className="space-y-3 font-mono text-xs relative pl-2">
              {/* Vertical connecting line */}
              <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-800" />

              {filteredTimeline.map((item, idx) => {
                const isItemCritical = item.status === 'CRITICAL'
                const isItemHeavy = item.status === 'HEAVY'

                return (
                  <div
                    key={`timeline-item-${idx}`}
                    onClick={() => onSelectCamera(item.cameraId)}
                    className="relative flex items-start gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Timeline Node Bullet */}
                    <div
                      className={`relative z-10 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-125 ${
                        isItemCritical
                          ? 'bg-rose-500 border-rose-300 shadow-md shadow-rose-500/50'
                          : isItemHeavy
                          ? 'bg-orange-500 border-orange-300 shadow-md shadow-orange-500/50'
                          : item.minute === 0
                          ? 'bg-cyan-500 border-cyan-300'
                          : 'bg-amber-500 border-amber-300'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    {/* Timeline Event Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold ${
                          isItemCritical ? 'text-rose-400' :
                          isItemHeavy ? 'text-orange-400' :
                          item.minute === 0 ? 'text-cyan-400' : 'text-amber-400'
                        }`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 group-hover:text-cyan-300 transition-colors">
                          Click to Focus →
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                        {item.message}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ⚠ Upcoming Traffic Risks Summary (Section 24) */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold text-amber-400 font-mono flex items-center gap-1.5 mb-2">
              <AlertTriangle size={13} />
              <span>UPCOMING TRAFFIC RISKS SUMMARY</span>
            </span>
            <div className="space-y-1.5">
              {filteredRisks.map((risk) => (
                <div
                  key={risk.id}
                  onClick={() => onSelectCamera(risk.cameraId)}
                  className="p-2 rounded bg-[#0b1426] border border-slate-800 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between gap-2 text-xs font-mono group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      risk.level === 'CRITICAL' ? 'bg-rose-400 animate-ping' :
                      risk.level === 'HEAVY' ? 'bg-orange-400' : 'bg-amber-400'
                    }`} />
                    <span className="font-bold text-white group-hover:text-cyan-300">
                      {risk.cameraId}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                      {risk.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                    {risk.confidence}% Conf
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Col 3: Prediction Timeline Graph (Section 31: Actual vs Predicted) ── */}
        <div className="rounded-xl bg-[#060a14] border border-slate-800 p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono tracking-wide">
                  10-MIN PREDICTION GRAPH
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                {cam.id} Curve
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-2">
              Vehicle Count Curve (<span className="text-cyan-400 font-bold">ACTUAL</span> vs <span className="text-rose-400 font-bold">PREDICTED</span>):
            </p>

            {/* SVG Visual Graph Container */}
            <div className="bg-[#0b1426] p-3 rounded-xl border border-slate-800 relative">
              <div className="h-44 w-full flex items-end justify-between pt-6 pb-2 px-1 relative">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-x-3 top-6 border-b border-slate-800/80 text-[9px] font-mono text-slate-600">
                  {maxCount} veh
                </div>
                <div className="absolute inset-x-3 top-24 border-b border-slate-800/50 text-[9px] font-mono text-slate-600">
                  {Math.round((maxCount + minCount) / 2)} veh
                </div>

                {/* Bars / Points representing trend */}
                {curveData.map((d, i) => {
                  const isActual = d.type === 'ACTUAL'
                  const heightPercent = Math.min(100, Math.max(15, ((d.count - minCount) / (maxCount - minCount)) * 80 + 15))

                  return (
                    <div key={`curve-pt-${i}`} className="flex flex-col items-center gap-1 z-10">
                      {/* Count value label */}
                      <span className={`text-[10px] font-mono font-bold ${
                        isActual ? 'text-cyan-300' : 'text-rose-300'
                      }`}>
                        {d.count}
                      </span>

                      {/* Bar indicator */}
                      <div className="w-6 sm:w-7 bg-slate-900 rounded-t h-24 flex items-end justify-center p-0.5">
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${
                            isActual
                              ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                              : 'bg-gradient-to-t from-rose-600/70 to-rose-400/90 border border-dashed border-rose-300'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Time Label */}
                      <span className={`text-[10px] font-mono ${
                        d.time === 'NOW' ? 'font-black text-white px-1 rounded bg-slate-800' : 'text-slate-400'
                      }`}>
                        {d.time}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Demarcation Legend */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-cyan-400" />
                  <span className="text-cyan-300 font-bold">ACTUAL DATA (-4m → NOW)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-rose-400 border border-dashed border-white" />
                  <span className="text-rose-300 font-bold">PREDICTED (+2m → +10m)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rationale Footer Callout */}
          <div className="mt-3 p-2.5 rounded-lg bg-[#060a14] border border-cyan-500/20 text-[11px] font-mono text-slate-400 flex items-start gap-2">
            <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Predictions recalculate in real-time based on trajectory volume, vehicle velocities, and cross-junction merge flows.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
