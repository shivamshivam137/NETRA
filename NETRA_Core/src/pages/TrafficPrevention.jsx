import { useState, useEffect, useMemo, useCallback } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import PreventionMetrics from '../components/prevention/PreventionMetrics'
import PreventionMapView from '../components/prevention/PreventionMapView'
import LiveCameraTrafficTable from '../components/prevention/LiveCameraTrafficTable'
import TrafficPredictionSection from '../components/prevention/TrafficPredictionSection'
import SignalTimingOptimizer from '../components/prevention/SignalTimingOptimizer'
import AlternateRouteRecommendation from '../components/prevention/AlternateRouteRecommendation'
import SimulationControlPanel from '../components/prevention/SimulationControlPanel'
import { 
  PRIMARY_INCIDENT, 
  NETWORK_CAMERAS,
  SIMULATION_PHASES 
} from '../services/trafficPreventionEngine'
import { 
  getPreventionStatus, 
  approvePreventionAction, 
  rejectPreventionAction, 
  executePreventionPlan, 
  resetPreventionSimulation 
} from '../services/api'
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Zap, 
  Radio, 
  Clock, 
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Route
} from 'lucide-react'

export default function TrafficPrevention() {
  const [incident, setIncident] = useState(PRIMARY_INCIDENT)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [liveTimestamp, setLiveTimestamp] = useState(new Date().toLocaleTimeString())
  
  // Real-time camera list with simulated live ANPR stream
  const [cameras, setCameras] = useState(NETWORK_CAMERAS)
  const [selectedCameraId, setSelectedCameraId] = useState('CAM-003')

  // Top Camera Filter ('ALL' or 'CAM-001', 'CAM-002', etc.)
  const [filterCameraId, setFilterCameraId] = useState('ALL')

  // Real-time clock tick
  useEffect(() => {
    const clock = setInterval(() => {
      setLiveTimestamp(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(clock)
  }, [])

  // Real-time data stream update interval (every 4 seconds subtle live fluctuation - Sections 4, 29)
  useEffect(() => {
    const dataStream = setInterval(() => {
      setCameras((prevCameras) =>
        prevCameras.map((cam) => {
          const vehicleJitter = Math.floor(Math.random() * 3) - 1 // -1, 0, or +1
          const newVehicles = Math.max(10, cam.currentVehicles + vehicleJitter)
          return {
            ...cam,
            currentVehicles: newVehicles,
          }
        })
      )
    }, 4000)
    return () => clearInterval(dataStream)
  }, [])

  // Auto-toast dismissal
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4500)
      return () => clearTimeout(t)
    }
  }, [toastMessage])

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type })
  }

  // Handle camera selection from table, cards, or map
  const handleSelectCamera = (camId) => {
    setSelectedCameraId(camId)
    const selected = cameras.find(c => c.id === camId)
    if (selected) {
      showToast(`Focused on ${camId} (${selected.name}) · GIS Map Re-centered`, 'info')
    }
  }

  // Handle Camera Filter Dropdown Change
  const handleFilterCameraChange = (camId) => {
    setFilterCameraId(camId)
    if (camId !== 'ALL') {
      setSelectedCameraId(camId)
      const selected = cameras.find(c => c.id === camId)
      showToast(`Filter applied: ${camId} (${selected?.name || ''}) · View isolated to this camera`, 'info')
    } else {
      showToast('Filter cleared: Showing entire multi-camera network', 'info')
    }
  }

  // Selected camera object
  const activeSelectedCamera = useMemo(() => {
    return cameras.find(c => c.id === selectedCameraId) || cameras[0]
  }, [cameras, selectedCameraId])

  // Handle Approve
  const handleApprove = async () => {
    try {
      setCurrentPhase(7) // Phase 7: Executing
      showToast('Prevention plan approved. Initiating signal timing & bypass simulation...', 'info')
      await approvePreventionAction(incident.id)

      // Advance to Phase 8 (Executed) after brief execution animation
      setTimeout(async () => {
        await executePreventionPlan(incident.id)
        setCurrentPhase(8)
        setIncident(prev => ({ ...prev, status: 'EXECUTED' }))
        showToast('✓ AI Prevention Simulation successfully executed! Traffic values updated.', 'success')
      }, 2000)
    } catch (err) {
      showToast('Error approving plan', 'error')
    }
  }

  // Handle Reject
  const handleReject = async () => {
    try {
      await rejectPreventionAction(incident.id)
      setIncident(prev => ({ ...prev, status: 'REJECTED' }))
      showToast('AI Prevention recommendation rejected and archived.', 'warning')
    } catch (err) {
      showToast('Error rejecting plan', 'error')
    }
  }

  // Handle Reset
  const handleReset = async () => {
    try {
      setIsAutoRunning(false)
      setCurrentPhase(1)
      await resetPreventionSimulation()
      setIncident({ ...PRIMARY_INCIDENT, status: 'PENDING' })
      setCameras(NETWORK_CAMERAS)
      setFilterCameraId('ALL')
      setSelectedCameraId('CAM-003')
      showToast('Simulation reset to baseline network state.', 'info')
    } catch (err) {
      showToast('Error resetting simulation', 'error')
    }
  }

  const isExecuted = currentPhase === 8 || incident.status === 'EXECUTED'
  const isExecuting = currentPhase === 7

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-10">
        {/* ── Toast Notification Banner ── */}
        {toastMessage && (
          <div className={`fixed top-18 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border font-mono text-xs flex items-center gap-2.5 transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-[#062117] border-emerald-500/70 text-emerald-300 shadow-emerald-500/20'
              : toastMessage.type === 'warning'
              ? 'bg-[#241708] border-amber-500/70 text-amber-300 shadow-amber-500/20'
              : 'bg-[#071629] border-cyan-500/70 text-cyan-300 shadow-cyan-500/20'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle size={16} className="text-amber-400" />
            ) : (
              <Info size={16} className="text-cyan-400" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        )}

        {/* ── Section 1: Page Header Bar with Explicit Simulation Disclaimer ── */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#091022] via-[#081329] to-[#091022] border border-slate-800/90 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldAlert size={22} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                TRAFFIC PREVENTION & CONTROL
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Radio size={10} className="text-emerald-400 animate-pulse" />
                <span>AI Engine v2.4</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              AI-assisted proactive traffic management · Multi-Camera Prediction & Signal Control
            </p>
          </div>

          {/* Right Header Status Indicators: Live Badge, Simulation Disclaimer, and Timestamp */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">LIVE STREAM</span>
            </div>

            {/* Prominent Mandatory Simulation Mode Disclaimer Badge (Sections 1, 37) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/50 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <div className="text-left">
                <span className="text-[11px] font-black font-mono text-amber-300 uppercase tracking-wide block">
                  SIMULATION MODE
                </span>
                <span className="text-[9px] font-mono text-amber-400/80 block">
                  Synthetic Actuation Feed (No Real-World Control)
                </span>
              </div>
            </div>

            {/* Real-Time Clock & Last Updated Timestamp (Section 4) */}
            <div className="px-3 py-1.5 rounded-lg bg-[#060a14] border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Clock size={13} className="text-cyan-400" />
              <span>Last updated: {liveTimestamp}</span>
            </div>
          </div>
        </div>

        {/* ── CAMERA FILTER BAR (Top Section) ── */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#091022] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Filter size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white uppercase tracking-wider">
                  FILTER BY CAMERA:
                </span>
                {filterCameraId !== 'ALL' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    ISOLATED: {filterCameraId}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {filterCameraId === 'ALL'
                  ? 'Showing complete multi-camera urban surveillance grid'
                  : `Filtering camera table, map focus, prediction, and signal plan to ${filterCameraId} only`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterCameraId}
              onChange={(e) => handleFilterCameraChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#060a14] border border-cyan-500/50 text-cyan-300 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner text-xs"
            >
              <option value="ALL">All Cameras ({cameras.length} Feeds)</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.name} ({c.congestion})
                </option>
              ))}
            </select>

            {filterCameraId !== 'ALL' && (
              <button
                onClick={() => handleFilterCameraChange('ALL')}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer font-bold"
              >
                Reset to All Cameras
              </button>
            )}
          </div>
        </div>

        {/* ── Section 2: Real-Time Network Status KPI Grid (6 Cards) ── */}
        <PreventionMetrics 
          cameras={cameras} 
          isExecuted={isExecuted}
          filterCameraId={filterCameraId}
          selectedCamera={activeSelectedCamera}
        />

        {/* ── Section 3: Live Camera Traffic Control Table (Filtered by Camera Filter) ── */}
        <LiveCameraTrafficTable
          cameras={cameras}
          selectedCameraId={selectedCameraId}
          filterCameraId={filterCameraId}
          onSelectCamera={handleSelectCamera}
        />

        {/* ── Section 8: Central GIS Prevention Map (Leaflet Map) ── */}
        <PreventionMapView
          simulationPhase={currentPhase}
          isExecuted={isExecuted}
          cameras={cameras}
          selectedCameraId={selectedCameraId}
          filterCameraId={filterCameraId}
          onSelectCamera={handleSelectCamera}
        />

        {/* ── Section 9: Traffic Prediction, Next 10 Min Timeline & Graph ── */}
        <TrafficPredictionSection
          selectedCamera={activeSelectedCamera}
          filterCameraId={filterCameraId}
          onSelectCamera={handleSelectCamera}
        />

        {/* ── Sections 16-22: 2-Column Grid: Smart Signal Optimization & AI Alternate Route ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SignalTimingOptimizer
            isExecuted={isExecuted}
            isExecuting={isExecuting}
            selectedCamera={activeSelectedCamera}
          />
          <AlternateRouteRecommendation
            isExecuted={isExecuted}
          />
        </div>

        {/* ── Sections 23-27: AI Prevention Control Center & Master Simulation Pipeline ── */}
        <SimulationControlPanel
          currentPhase={currentPhase}
          setCurrentPhase={setCurrentPhase}
          isAutoRunning={isAutoRunning}
          setIsAutoRunning={setIsAutoRunning}
          onApprove={handleApprove}
          onReject={handleReject}
          onReset={handleReset}
        />
      </div>
    </DashboardLayout>
  )
}
