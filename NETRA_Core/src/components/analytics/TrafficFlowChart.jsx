import { useState } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts'
import { trafficData } from '../../data/mockData'
import { Activity, Gauge, TrendingUp } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#080d19]/95 border border-slate-700/90 rounded-lg p-3 shadow-2xl text-xs backdrop-blur-md font-mono">
        <div className="text-slate-300 font-bold mb-1.5 pb-1 border-b border-slate-800">{label} HRS IST</div>
        <div className="flex items-center justify-between gap-4 text-cyan-400 font-bold">
          <span>Flow Volume:</span>
          <span>{data.volume} vph</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold mt-1">
          <span>Avg Speed:</span>
          <span>{data.speed} km/h</span>
        </div>
        {data.incidents > 0 && (
          <div className="flex items-center justify-between gap-4 text-rose-400 font-bold mt-1 pt-1 border-t border-slate-800">
            <span>Incidents:</span>
            <span>{data.incidents} detected</span>
          </div>
        )}
      </div>
    )
  }
  return null
}

export default function TrafficFlowChart() {
  const [metric, setMetric] = useState('volume') // 'volume' or 'speed'

  // Peak hourly volume
  const peak = Math.max(...trafficData.map(d => d.volume))

  return (
    <div className="bg-[#091022]/90 backdrop-blur-xs border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white font-mono">
              Traffic Flow Telemetry
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Hourly vehicle throughput & corridor speed</p>
          </div>
        </div>

        {/* View Switcher & Peak pill */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <TrendingUp size={12} className="text-cyan-400" />
            <span>Peak: <strong className="text-white">{peak} vph</strong></span>
          </div>

          <div className="flex items-center bg-[#060a14] p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMetric('volume')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                metric === 'volume' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setMetric('speed')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                metric === 'speed' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Speed
            </button>
          </div>
        </div>
      </div>

      {/* ── Chart Area ── */}
      <div className="w-full h-56 sm:h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={metric === 'volume' ? 'volume' : 'speed'} 
              stroke={metric === 'volume' ? '#06b6d4' : '#10b981'} 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill={metric === 'volume' ? 'url(#volumeGradient)' : 'url(#speedGradient)'} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
