import { useState, useMemo } from 'react'
import { 
  Camera, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Gauge, 
  Zap, 
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react'

export default function LiveCameraTrafficTable({ 
  cameras = [], 
  selectedCameraId = 'CAM-003', 
  filterCameraId = 'ALL',
  onSelectCamera = () => {} 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState('ALL') // ALL, CRITICAL, HEAVY, MODERATE, NORMAL

  // Filtered cameras list
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      const matchesCameraFilter = filterCameraId === 'ALL' || cam.id === filterCameraId
      const matchesSearch = 
        cam.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.junction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.zone.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter = 
        filterLevel === 'ALL' ||
        cam.congestion === filterLevel

      return matchesCameraFilter && matchesSearch && matchesFilter
    })
  }, [cameras, filterCameraId, searchQuery, filterLevel])

  const getDensityBadge = (density) => {
    switch (density) {
      case 'VERY HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40'
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }
  }

  const getCongestionBadge = (congestion) => {
    switch (congestion) {
      case 'CRITICAL':
        return 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20 animate-pulse'
      case 'HEAVY':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40'
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }
  }

  const getActionButton = (action, isSelected) => {
    switch (action) {
      case 'URGENT':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20 flex items-center justify-center gap-1">
            <AlertTriangle size={12} className="animate-bounce" />
            URGENT
          </span>
        )
      case 'OPTIMIZE':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1">
            <Zap size={12} />
            OPTIMIZE
          </span>
        )
      case 'MONITOR':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-1">
            <Activity size={12} />
            MONITOR
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded text-[11px] font-mono text-slate-400 border border-slate-800 flex items-center justify-center">
            NO ACTION
          </span>
        )
    }
  }

  return (
    <div className="bg-[#091022] border border-slate-800/90 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* ── Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera size={18} />
            </div>
            <h2 className="text-base font-bold text-white font-mono tracking-wide">
              LIVE CAMERA TRAFFIC CONTROL
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
              {cameras.length} Monitored Feeds
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Individual Camera Real-Time ANPR Telemetry, Speed Profiling, and Proactive AI Green Allocation
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search camera / junction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#060a14] border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors w-48 sm:w-56"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#060a14] p-1 rounded-lg border border-slate-800">
            {['ALL', 'CRITICAL', 'HEAVY', 'MODERATE', 'NORMAL'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterLevel(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  filterLevel === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Camera Table ── */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#060a14]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#070e1c] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Camera</th>
              <th className="py-2.5 px-3">Current Vehicles</th>
              <th className="py-2.5 px-3">Avg Speed</th>
              <th className="py-2.5 px-3">Density</th>
              <th className="py-2.5 px-3">Congestion</th>
              <th className="py-2.5 px-3">Current Green</th>
              <th className="py-2.5 px-3">AI Green</th>
              <th className="py-2.5 px-3">Change</th>
              <th className="py-2.5 px-3 min-w-[170px]">Prediction</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
            {filteredCameras.map((cam) => {
              const isSelected = cam.id === selectedCameraId

              return (
                <tr
                  key={cam.id}
                  onClick={() => onSelectCamera(cam.id)}
                  className={`cursor-pointer transition-colors duration-150 group ${
                    isSelected 
                      ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400' 
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Camera ID & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        cam.congestion === 'CRITICAL' ? 'bg-rose-500 animate-ping' :
                        cam.congestion === 'HEAVY' ? 'bg-orange-400' :
                        cam.congestion === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{cam.id}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              ACTIVE FOCUS
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {cam.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Current Vehicles */}
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-bold text-white text-sm">
                        {cam.currentVehicles} <span className="text-[11px] font-normal text-slate-400">vehicles</span>
                      </span>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="text-emerald-400/80">+{cam.inflow}/m in</span>
                        <span>·</span>
                        <span className="text-cyan-400/80">-{cam.outflow}/m out</span>
                      </div>
                    </div>
                  </td>

                  {/* Avg Speed */}
                  <td className="py-3 px-3">
                    <span className={`font-bold ${
                      cam.avgSpeed <= 15 ? 'text-rose-400' :
                      cam.avgSpeed <= 25 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {cam.avgSpeed} km/h
                    </span>
                  </td>

                  {/* Density */}
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDensityBadge(cam.density)}`}>
                      {cam.density}
                    </span>
                  </td>

                  {/* Congestion */}
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCongestionBadge(cam.congestion)}`}>
                      {cam.congestion}
                    </span>
                  </td>

                  {/* Current Green */}
                  <td className="py-3 px-3 text-slate-300">
                    <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      {cam.currentGreen} sec
                    </span>
                  </td>

                  {/* AI Green */}
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/40">
                      {cam.aiGreen} sec
                    </span>
                  </td>

                  {/* Change */}
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] inline-flex items-center gap-0.5 ${
                      cam.delta > 0 
                        ? 'text-emerald-400 bg-emerald-500/10' 
                        : cam.delta < 0 
                        ? 'text-cyan-400 bg-cyan-500/10' 
                        : 'text-slate-400 bg-slate-800'
                    }`}>
                      {cam.delta > 0 ? `+${cam.delta} sec` : cam.delta < 0 ? `${cam.delta} sec` : '0 sec'}
                    </span>
                  </td>

                  {/* Prediction */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold truncate ${
                        cam.prediction?.status === 'EXPECTED' ? 'text-rose-400 font-bold' :
                        cam.prediction?.status === 'LIKELY' ? 'text-orange-400' :
                        cam.prediction?.status === 'POSSIBLE' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {cam.prediction?.text}
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    {getActionButton(cam.action, isSelected)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
        <span>Showing all {filteredCameras.length} cameras · Click any row to focus GIS Map & AI Prediction</span>
        <span className="text-cyan-400">Selected: {selectedCameraId}</span>
      </div>
    </div>
  )
}
