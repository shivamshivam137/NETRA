import { 
  LayoutDashboard, 
  Map, 
  Car, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  Shield, 
  ShieldAlert,
  X,
  Radio,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { alerts } from '../../data/mockData'
import { useLanguage } from '../../context/LanguageContext'
import { useSidebar } from '../../context/SidebarContext'

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { t } = useLanguage()
  const { isCollapsed, toggleCollapse } = useSidebar()

  const activeAlertCount = alerts.filter(a => {
    const s = a.status?.toLowerCase()
    return s === 'active' || s === 'open' || s === 'investigating'
  }).length

  const NAV_ITEMS = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('liveMap'), path: '/map', icon: Map, badge: 'Live', badgeType: 'live' },
    { name: t('vehicles'), path: '/vehicles', icon: Car },
    { name: t('alerts'), path: '/alerts', icon: AlertTriangle, badge: activeAlertCount.toString(), badgeType: 'alert' },
    { name: t('analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('trafficPrevention'), path: '/prevention', icon: ShieldAlert, badge: 'AI Sim', badgeType: 'alert' },
    { name: t('settings'), path: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 bg-[#080d19] border-r border-slate-800/80 
        flex flex-col transition-all duration-300 ease-in-out select-none
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand header */}
        <div className={`h-16 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        } border-b border-slate-800/80 bg-[#091022]/80 relative`}>
          {!isCollapsed ? (
            <Link to="/dashboard" className="flex items-center gap-3 group min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-widest text-white text-base font-mono">NETRA</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                </div>
                <p className="text-[9px] uppercase tracking-wider text-cyan-400 font-semibold truncate">{t('urbanCommandCenter')}</p>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" title="NETRA Urban Command Center" className="flex items-center justify-center group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </Link>
          )}

          {/* Desktop Collapse / Expand Button at the top-right edge */}
          {!isCollapsed ? (
            <button 
              onClick={toggleCollapse}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md bg-[#0b1426] border border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer shrink-0 ml-2"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <button 
              onClick={toggleCollapse}
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
              className="hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-[#091022] border-2 border-cyan-500/70 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-400 transition-all duration-200 shadow-md shadow-cyan-500/30 cursor-pointer absolute -right-3 top-5 z-50"
            >
              <ChevronRight size={13} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <div className={`flex-1 py-5 ${isCollapsed ? 'px-2' : 'px-3'} overflow-y-auto space-y-1.5 custom-scrollbar`}>
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {t('navigation')}
            </div>
          ) : (
            <div className="h-px bg-slate-800/80 mx-2 mb-3" />
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.name}
                onClick={() => onClose?.()}
                className={`
                  relative flex items-center ${isCollapsed ? 'justify-center py-2.5 px-2' : 'justify-between px-3.5 py-2.5'} rounded-lg text-sm font-medium transition-all duration-150 group
                  ${isActive 
                    ? isCollapsed
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                      : 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}
                `}
              >
                {/* Icon & Label (or centered icon in minimized state) */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} relative`}>
                  <Icon size={18} className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                  
                  {!isCollapsed && <span>{item.name}</span>}

                  {/* Dot Badge in Collapsed State */}
                  {isCollapsed && item.badge && (
                    <span className={`w-2 h-2 rounded-full absolute -top-1 -right-1.5 ${
                      item.badgeType === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`} />
                  )}
                </div>

                {/* Badge in Expanded State */}
                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-transform group-hover:scale-105 ${
                    item.badgeType === 'live' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs shadow-emerald-500/20' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Floating Tooltip in Minimized State on Hover */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#091022] text-white text-xs font-mono font-medium rounded-lg border border-slate-700 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 whitespace-nowrap z-50 flex items-center gap-2">
                    <span className="font-bold text-slate-100">{item.name}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        item.badgeType === 'live' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* System telemetry footer */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-slate-800/80 bg-[#060a14]/80">
            <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3 shadow-inner">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Radio size={12} className="text-emerald-400 animate-pulse" />
                  {t('streamEngine')}
                </span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">99.8% OK</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[99.8%] rounded-full shadow-sm shadow-emerald-400/50" />
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex justify-between font-mono">
                <span>Latency: 24ms</span>
                <span>Enc: H.264</span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="p-3 border-t border-slate-800/80 bg-[#060a14]/80 flex flex-col items-center justify-center group relative cursor-pointer"
            title="Stream Engine: 99.8% OK · Latency: 24ms"
          >
            <div className="p-2 rounded-lg bg-[#0b1329] border border-slate-800 text-emerald-400 flex items-center justify-center">
              <Radio size={16} className="animate-pulse" />
            </div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1">99.8%</span>
            
            {/* Telemetry Floating Tooltip in Minimized State */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#091022] text-white text-xs font-mono rounded-lg border border-slate-700 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 whitespace-nowrap z-50">
              <div className="text-emerald-400 font-bold">Stream Engine: 99.8% OK</div>
              <div className="text-slate-400 text-[10px]">Latency: 24ms · Enc: H.264</div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
