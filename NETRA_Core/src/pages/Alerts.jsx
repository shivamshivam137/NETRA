import { useState, useMemo, useEffect, useCallback } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import AlertSummaryCards from '../components/alerts/AlertSummaryCards'
import AlertFilters from '../components/alerts/AlertFilters'
import AlertList from '../components/alerts/AlertList'
import AlertDetails from '../components/alerts/AlertDetails'
import { alerts as initialAlerts } from '../data/mockData'
import { getAlerts, updateAlertStatus } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'
import { ShieldAlert, Radio, Activity, RefreshCw } from 'lucide-react'

export default function Alerts() {
  const [alertList, setAlertList] = useState(initialAlerts)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all') // 'all', 'critical', 'high', 'medium', 'low'
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'investigating', 'resolved'
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Fetch live alerts from Supabase or fallback
  const fetchLatestAlerts = useCallback(async () => {
    try {
      const { data } = await getAlerts()
      if (data && data.length > 0) {
        setAlertList(data)
      }
    } catch (err) {
      console.warn('Failed to fetch alerts:', err)
    }
  }, [])

  useEffect(() => {
    fetchLatestAlerts()
  }, [fetchLatestAlerts])

  // Realtime subscription: update alert list live when DB changes
  useWebSocket('netra-alerts-page', {
    enabled: true,
    onMessage: (msg) => {
      if (msg.table === 'alerts') {
        fetchLatestAlerts()
      }
    },
  })

  // Status transition handler
  const handleStatusChange = async (alertId, newStatus) => {
    // Optimistic update
    setAlertList(prev => prev.map(a => {
      if (a.id === alertId) {
        const updated = { ...a, status: newStatus }
        if (selectedAlert?.id === alertId) {
          setSelectedAlert(updated)
        }
        return updated
      }
      return a
    }))

    // Persist to Supabase
    try {
      await updateAlertStatus(alertId, newStatus)
    } catch (err) {
      console.warn('Failed to update alert status in Supabase:', err)
    }
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setSeverityFilter('all')
    setStatusFilter('all')
  }

  // Filter & Search evaluation
  const filteredAlerts = useMemo(() => {
    return alertList.filter(alert => {
      // 1. Severity filter
      if (severityFilter !== 'all' && alert.severity?.toLowerCase() !== severityFilter.toLowerCase()) {
        return false
      }

      // 2. Status filter
      if (statusFilter !== 'all' && alert.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchPlate = (alert.vehiclePlate || alert.plate || '').toLowerCase().includes(q)
        const matchCamera = (alert.cameraId || '').toLowerCase().includes(q)
        const matchLocation = (alert.location || '').toLowerCase().includes(q)
        const matchType = (alert.type || '').toLowerCase().includes(q)
        const matchDesc = (alert.description || alert.message || '').toLowerCase().includes(q)
        const matchId = (alert.id || '').toLowerCase().includes(q)

        if (!matchPlate && !matchCamera && !matchLocation && !matchType && !matchDesc && !matchId) {
          return false
        }
      }

      return true
    })
  }, [alertList, searchQuery, severityFilter, statusFilter])

  const hasActiveFilters = searchQuery.trim() !== '' || severityFilter !== 'all' || statusFilter !== 'all'

  const handleSync = async () => {
    setIsSyncing(true)
    await fetchLatestAlerts()
    setTimeout(() => setIsSyncing(false), 500)
  }

  return (
    <DashboardLayout title="City-Wide Incident Alert Center">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* ── 1. Alerts Header Section ── */}
        <div className="bg-[#091022]/95 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/20">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                  Alerts & Incidents
                </h1>
                <span className="text-[10px] bg-rose-500/15 text-rose-300 px-2.5 py-0.5 rounded font-mono font-bold border border-rose-500/30 uppercase">
                  ACTIVE QUEUE: {alertList.filter(a => a.status?.toLowerCase() === 'active').length} UNRESOLVED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Monitor and investigate traffic events across the network
              </p>
            </div>
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 bg-[#070c18] border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-[11px]">System Status:</span>
              <span className="text-emerald-400 font-bold">Monitoring Active</span>
            </div>

            <button
              type="button"
              onClick={handleSync}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070c18] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer text-xs"
              title="Sync alerts telemetry"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-cyan-400' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* ── 2. Alert Summary Cards ── */}
        <AlertSummaryCards alerts={alertList} />

        {/* ── 3. Search & Filter Bar ── */}
        <AlertFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          totalResults={filteredAlerts.length}
        />

        {/* ── 4. Main Alert List / Table ── */}
        <AlertList
          alerts={filteredAlerts}
          onSelectAlert={(alert) => setSelectedAlert(alert)}
          onResetFilters={handleClearFilters}
        />

        {/* ── 5. Alert Details Modal ── */}
        {selectedAlert && (
          <AlertDetails
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onStatusChange={handleStatusChange}
          />
        )}

      </div>
    </DashboardLayout>
  )
}
