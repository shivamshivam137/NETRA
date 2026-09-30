import { useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'
import { speedTrendData } from '../../data/mockData'
import { Gauge, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react'

function SpeedTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const isBelowLimit = data.avgSpeed < data.targetLimit
    return (
      <div className="bg-[#080d19]/95 border border-slate-700/90 rounded-lg p-3 shadow-2xl text-xs backdrop-blur-md font-mono">
        <div className="text-slate-300 font-bold mb-1.5 pb-1 border-b border-slate-800">{label} HRS IST</div>
        <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
          <span>Avg Network Speed:</span>
          <span>{data.avgSpeed} km/h</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400 font-medium mt-1">
          <span>Target Speed Limit:</span>
          <span>{data.targetLimit} km/h</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400 font-medium mt-0.5">
          <span>Speed Range:</span>
          <span>{data.minSpeed} – {data.maxSpeed} km/h</span>
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between gap-2 text-[10px]">
          <span className="text-slate-500">Grid Status:</span>
          <span className={`font-bold uppercase ${
            data.avgSpeed <= 25 ? 'text-rose-400' : data.avgSpeed <= 45 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {data.avgSpeed <= 25 ? 'Severe Congestion' : data.avgSpeed <= 45 ? 'Moderate Sluggish' : 'Free Flow'}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function AverageSpeedChart() {
  // Compute minimum and average speeds
  const minSpeed = Math.min(...speedTrendData.map(d => d.avgSpeed))
  const avgOverall = Math.round(speedTrendData.reduce((acc, d) => acc + d.avgSpeed, 0) / speedTrendData.length)

  return (
    <div className="bg-[#091022]/90 backdrop-blur-xs border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Gauge size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white font-mono uppercase">
              Average Speed Trend
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Velocity progression & corridor speed limits</p>
          </div>
        </div>

        {/* Speed indicators */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="text-slate-400">Mean:</span>
            <strong className="text-emerald-400">{avgOverall} km/h</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
            <span className="text-slate-400">Trough:</span>
            <strong className="text-rose-400">{minSpeed} km/h (08:00)</strong>
          </div>
        </div>
      </div>

      {/* ── Chart Area ── */}
      <div className="w-full h-56 sm:h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={speedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="speedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
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
              domain={[0, 105]}
            />
            <Tooltip content={<SpeedTooltip />} />
            
            {/* Speed Limit Reference Line */}
            <ReferenceLine 
              y={60} 
              stroke="#f59e0b" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              label={{ 
                value: 'Limit 60 km/h', 
                fill: '#f59e0b', 
                fontSize: 10, 
                position: 'insideTopRight',
                fontFamily: 'monospace'
              }} 
            />

            {/* Area Fill */}
            <Area 
              type="monotone" 
              dataKey="avgSpeed" 
              fill="url(#speedAreaGradient)" 
              stroke="none"
            />

            {/* Primary Speed Line */}
            <Line 
              type="monotone" 
              dataKey="avgSpeed" 
              stroke="#10b981" 
              strokeWidth={2.5}
              dot={{ fill: '#10b981', r: 3, strokeWidth: 1.5, stroke: '#060a14' }}
              activeDot={{ r: 5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
