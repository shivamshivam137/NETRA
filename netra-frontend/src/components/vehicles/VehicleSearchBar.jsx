import { useState } from 'react'
import { Search, X, Sparkles } from 'lucide-react'

export default function VehicleSearchBar({ 
  onSearch, 
  onClear, 
  currentQuery = '',
  samplePlates = ['MH 01 AV 1234', 'MH 04 BT 9876', 'MH 12 AB 3310', 'MH 43 DK 5541', 'MH 02 CF 4421']
}) {
  const [inputValue, setInputValue] = useState(currentQuery)

  const handleSearch = (e) => {
    e?.preventDefault()
    onSearch(inputValue)
  }

  const handleClear = () => {
    setInputValue('')
    onClear?.()
  }

  const handleSampleClick = (plate) => {
    setInputValue(plate)
    onSearch(plate)
  }

  return (
    <div className="bg-[#091022]/90 backdrop-blur-xs border border-slate-800/90 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label htmlFor="vehicle-plate-search" className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Search size={14} className="text-cyan-400" />
          <span>Search Vehicle</span>
        </label>
        <span className="text-[11px] font-mono text-slate-500">
          Case-insensitive ANPR lookup
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none flex items-center">
            <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700 mr-1.5">
              IND
            </span>
          </div>

          <input
            id="vehicle-plate-search"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter license plate (e.g. MH 01 AV 1234)"
            className="w-full bg-[#060a14] border border-slate-700/80 rounded-lg pl-14 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-mono tracking-wide focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all uppercase"
            autoComplete="off"
            spellCheck="false"
          />

          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
              title="Clear input"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Search size={14} />
          <span>Search</span>
        </button>
      </form>

      {/* Sample Quick-Pick Plate Tags */}
      {samplePlates && samplePlates.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles size={11} className="text-cyan-400" />
            Quick Targets:
          </span>
          {samplePlates.map((plate) => (
            <button
              key={plate}
              type="button"
              onClick={() => handleSampleClick(plate)}
              className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#060a14] hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              {plate}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
