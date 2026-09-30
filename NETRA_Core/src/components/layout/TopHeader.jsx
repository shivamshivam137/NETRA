import { useState, useEffect, useRef } from 'react'
import { 
  Menu, 
  Bell, 
  Shield, 
  User, 
  ChevronDown, 
  LogOut, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { alerts } from '../../data/mockData'
import { useLanguage } from '../../context/LanguageContext'
import { getCurrentPersonnel, logoutPersonnel } from '../../services/api'

export default function TopHeader({ title = 'Dashboard Overview', onOpenSidebar }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [time, setTime] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [personnel, setPersonnel] = useState(getCurrentPersonnel)

  useEffect(() => {
    setPersonnel(getCurrentPersonnel())
  }, [])

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Live digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST')
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadAlerts = alerts.filter(a => {
    const s = a.status?.toLowerCase()
    return s === 'active' || s === 'open' || s === 'investigating'
  }).slice(0, 4)

  return (
    <header className="h-16 bg-[#080d19]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* ── Left section: mobile menu toggle & Title ── */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
            {t('headerSubtitle')}
          </p>
        </div>
      </div>

      {/* ── Right section: Clock, Status, Notifications, User profile ── */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock size={12} className="text-cyan-400" />
          <span>{time || '12:00:00 IST'}</span>
        </div>

        {/* System Online Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium select-none shadow-sm shadow-emerald-500/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide font-mono font-semibold">{t('systemOnline')}</span>
        </div>

        {/* ── Notifications Dropdown ── */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg transition-all cursor-pointer ${
              showNotifications 
                ? 'bg-slate-800 text-cyan-400' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#080d19]"></span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a1122] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#080d19]">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {t('priorityAlerts')}
                  </span>
                </div>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-500/30">
                  {unreadAlerts.length} {t('unresolved')}
                </span>
              </div>

              <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                {unreadAlerts.map(alert => (
                  <div key={alert.id} className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800/80 hover:bg-[#0d172e] transition-colors text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-rose-400 uppercase font-mono">{alert.type}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 font-medium">{alert.description || alert.message}</p>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-slate-800 bg-[#080d19] text-center">
                <Link
                  to="/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium py-1 px-3 rounded hover:bg-cyan-500/10 transition-colors"
                >
                  <span>{t('viewAllAlerts')}</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── User Profile Dropdown ── */}
        <div className="relative pl-2 sm:pl-3 border-l border-slate-800" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-cyan-500/30 shadow-md">
              {(personnel?.full_name || 'NC').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-200">{personnel?.full_name || 'Operator'}</div>
              <div className="text-[10px] text-slate-400">{personnel?.role || t('sectorCommand')}</div>
            </div>
            <ChevronDown size={14} className={`text-slate-500 hidden md:block transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Menu */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0a1122] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
              <div className="p-3 border-b border-slate-800 bg-[#080d19]">
                <div className="text-xs font-bold text-white">{personnel?.full_name || 'Operator'}</div>
                <div className="text-[10px] text-slate-400 font-mono">ID: {personnel?.org_id || 'NETRA-OP-8821'}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Mumbai Metro Jurisdiction</div>
              </div>

              <div className="p-1.5">
                <Link
                  to="/dashboard"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <Shield size={14} className="text-cyan-400" />
                  {t('commandDashboard')}
                </Link>
                <Link
                  to="/map"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <CheckCircle size={14} className="text-emerald-400" />
                  {t('liveSurveillanceGrid')}
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <ShieldCheck size={14} className="text-amber-400" />
                  {t('systemPreferences')}
                </Link>
              </div>

              <div className="p-1.5 border-t border-slate-800 bg-[#080d19]/60">
                <button
                  onClick={async () => {
                    setShowProfile(false)
                    await logoutPersonnel()
                    navigate('/login')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  {t('signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
