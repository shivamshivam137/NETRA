import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import VehicleSearchBar from '../components/vehicles/VehicleSearchBar'
import VehicleDetailsCard from '../components/vehicles/VehicleDetailsCard'
import VehicleNotFound from '../components/vehicles/VehicleNotFound'
import VehicleSearchEmptyState from '../components/vehicles/VehicleSearchEmptyState'
import VehicleTrajectory from '../components/vehicles/VehicleTrajectory'
import { vehicles as allVehicles, trajectories, getVehicleTrajectory } from '../data/mockData'
import { getVehicles, searchVehicleByPlate } from '../services/api'
import { Car, AlertTriangle, ShieldCheck, Video, Clock, ChevronRight, Sparkles, Filter } from 'lucide-react'

// Helper to normalize plate strings (removes spaces, uppercase)
const normalizePlate = (str) => (str || '').replace(/[\s\-_]/g, '').toUpperCase()

export default function Vehicles() {
  const [searchParams] = useSearchParams()
  const [vehicleList, setVehicleList] = useState(allVehicles)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [isViewingTrajectory, setIsViewingTrajectory] = useState(false)
  const [tableFilter, setTableFilter] = useState('all') // 'all', 'flagged', 'tracked'

  // Fetch vehicles from Supabase with mock fallback
  useEffect(() => {
    let isMounted = true
    getVehicles().then(({ data }) => {
      if (isMounted && data && data.length > 0) {
        setVehicleList(data)
      }
    })
    return () => { isMounted = false }
  }, [])

  // Handle URL query parameters from Alert navigation (e.g. ?plate=MH%2004%20BT%209876&view=trajectory)
  useEffect(() => {
    const plateParam = searchParams.get('plate')
    const viewParam = searchParams.get('view')
    if (plateParam) {
      handleSearch(plateParam)
      if (viewParam === 'trajectory') {
        setIsViewingTrajectory(true)
      }
    }
  }, [searchParams])

  const samplePlates = useMemo(() => vehicleList.map(v => v.plate), [vehicleList])

  // Execute Search
  const handleSearch = (query) => {
    const trimmed = (query || '').trim()
    setSearchQuery(trimmed)
    setHasSearched(true)

    if (!trimmed) {
      setSelectedVehicle(null)
      setHasSearched(false)
      setIsViewingTrajectory(false)
      return
    }

    const normQuery = normalizePlate(trimmed)

    // Find best match: exact normalized plate, then starts-with, then includes
    const match = vehicleList.find(v => normalizePlate(v.plate) === normQuery) ||
      vehicleList.find(v => normalizePlate(v.plate).includes(normQuery)) ||
      vehicleList.find(v => v.id.toLowerCase() === trimmed.toLowerCase()) ||
      vehicleList.find(v => v.make.toLowerCase().includes(trimmed.toLowerCase()))

    setSelectedVehicle(match || null)
  }

  // Clear / Reset Search
  const handleClear = () => {
    setSearchQuery('')
    setHasSearched(false)
    setSelectedVehicle(null)
    setIsViewingTrajectory(false)
  }

  // Select directly from directory table
  const handleSelectFromTable = (vehicle) => {
    setSearchQuery(vehicle.plate)
    setHasSearched(true)
    setSelectedVehicle(vehicle)
    setIsViewingTrajectory(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Current vehicle trajectory if available
  const activeTrajectory = useMemo(() => {
    if (!selectedVehicle) return null
    return getVehicleTrajectory(selectedVehicle.plate) || getVehicleTrajectory(selectedVehicle.id)
  }, [selectedVehicle])

  // Filtered list for the directory table below
  const filteredTableVehicles = vehicleList.filter(v => {
    if (tableFilter === 'flagged' && !v.flagged) return false
    if (tableFilter === 'tracked' && v.flagged) return false
    return true
  })

  return (
    <DashboardLayout title="Vehicle Intelligence & Search">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* ── 1. Vehicle Search Bar ── */}
        <VehicleSearchBar
          currentQuery={searchQuery}
          onSearch={handleSearch}
          onClear={handleClear}
          samplePlates={samplePlates}
        />

        {/* ── 2. Search Result / Trajectory / Intelligence State ── */}
        <div>
          {hasSearched ? (
            selectedVehicle ? (
              isViewingTrajectory ? (
                <VehicleTrajectory
                  vehicle={selectedVehicle}
                  trajectory={activeTrajectory}
                  onBack={() => setIsViewingTrajectory(false)}
                />
              ) : (
                <VehicleDetailsCard
                  vehicle={selectedVehicle}
                  onViewTrajectory={() => {
                    setIsViewingTrajectory(true)
                  }}
                />
              )
            ) : (
              <VehicleNotFound
                query={searchQuery}
                onReset={(newPlate) => {
                  setIsViewingTrajectory(false)
                  if (newPlate) handleSearch(newPlate)
                  else handleClear()
                }}
                samplePlates={samplePlates.slice(0, 3)}
              />
            )
          ) : (
            <VehicleSearchEmptyState
              onSelectPlate={handleSearch}
              samplePlates={samplePlates}
            />
          )}
        </div>

        {/* ── 3. ANPR Vehicle Registry Directory (Table) ── */}
        <div className="bg-[#091022]/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0">
          {/* Table Header Controls */}
          <div className="p-4 bg-[#070c18] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Car size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Monitored Vehicle Fleet ({allVehicles.length})
                </h3>
                <p className="text-[11px] text-slate-400">Click any row to inspect full telemetry card</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setTableFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  tableFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-[#060a14] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({allVehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('tracked')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  tableFilter === 'tracked'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-[#060a14] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Active Track ({allVehicles.filter(v => !v.flagged).length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('flagged')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  tableFilter === 'flagged'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-[#060a14] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Flagged ({allVehicles.filter(v => v.flagged).length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060a14] border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">License Plate</th>
                  <th className="p-4">Make & Model</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Sightings</th>
                  <th className="p-4">Last Detected</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredTableVehicles.map((v) => {
                  const isSelected = selectedVehicle?.id === v.id
                  return (
                    <tr
                      key={v.id}
                      onClick={() => handleSelectFromTable(v)}
                      className={`transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-950/40 border-l-4 border-cyan-400' 
                          : 'hover:bg-[#0c1428]'
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-cyan-300 flex items-center gap-2">
                        <span className="bg-cyan-950/70 text-cyan-200 px-2 py-1 rounded border border-cyan-800/50 text-xs font-mono shadow-xs">
                          {v.plate}
                        </span>
                      </td>
                      <td className="p-4 text-slate-200 font-semibold">
                        {v.make} <span className="text-slate-500 font-normal">({v.color})</span>
                      </td>
                      <td className="p-4 uppercase text-[10px] font-mono text-slate-400 font-bold">
                        {v.type}
                      </td>
                      <td className="p-4">
                        {v.flagged ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                            <AlertTriangle size={11} />
                            {v.flagReason || 'Flagged'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                            <ShieldCheck size={11} />
                            Clean Record
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-slate-300 font-bold">
                        {v.totalSightings} nodes
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {new Date(v.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
