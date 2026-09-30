import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { applyTheme, getCurrentThemePreference } from '../utils/theme'
import { useLanguage } from '../context/LanguageContext'
import { getUserSettings, saveUserSettings } from '../services/api'
import {
  Settings as SettingsIcon,
  Map,
  Bell,
  RefreshCw,
  ShieldCheck,
  Radio,
  Check,
  RotateCcw,
  Monitor,
} from 'lucide-react'

/* ─── Default Settings ────────────────────────────────────────────────── */
const DEFAULT_SETTINGS = {
  monitoring: true,
  showCameraMarkers: true,
  showCameraLabels: true,
  showTrafficDensity: true,
  autoCenterMap: false,
  criticalAlerts: true,
  highAlerts: true,
  mediumAlerts: true,
  lowAlerts: false,
  refreshInterval: '30s',
  theme: 'Dark',
  density: 'Comfortable',
  language: 'English',
}

/* ─── Reusable React-Controlled Toggle ────────────────────────────────── */
function Toggle({ id, checked, onChange, accentColor = 'cyan' }) {
  const trackColors = {
    cyan:    'bg-cyan-500',
    emerald: 'bg-emerald-500',
    rose:    'bg-rose-500',
    amber:   'bg-amber-500',
    blue:    'bg-blue-500',
  }

  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center p-1 focus-within:ring-2 focus-within:ring-cyan-500/40 focus-within:ring-offset-1 focus-within:ring-offset-[#091022] ${
          checked ? (trackColors[accentColor] || trackColors.cyan) : 'bg-slate-700'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  )
}

/* ─── Section Header ──────────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, iconColor = 'text-cyan-400' }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 mb-4">
      <Icon size={16} className={iconColor} />
      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
        {label}
      </h3>
    </div>
  )
}

/* ─── Setting Row ─────────────────────────────────────────────────────── */
function SettingRow({ label, description, children, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${className}`}>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        {description && (
          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

/* ─── Select Input ────────────────────────────────────────────────────── */
function SettingSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#060a14] border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 cursor-pointer min-w-[160px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

/* ─── Main Settings Page ──────────────────────────────────────────────── */
export default function Settings() {
  const { language: currentLang, setLanguage, t } = useLanguage()

  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    theme: getCurrentThemePreference(),
    language: currentLang || 'English',
  }))
  const [savedNotice, setSavedNotice] = useState(false)

  // Load user settings from Supabase on mount
  useEffect(() => {
    let isMounted = true
    getUserSettings().then(({ data }) => {
      if (isMounted && data) {
        setSettings((prev) => ({
          ...prev,
          monitoring: data.monitoring ?? prev.monitoring,
          showCameraMarkers: data.show_camera_markers ?? prev.showCameraMarkers,
          showCameraLabels: data.show_camera_labels ?? prev.showCameraLabels,
          showTrafficDensity: data.show_traffic_density ?? prev.showTrafficDensity,
          autoCenterMap: data.auto_center_map ?? prev.autoCenterMap,
          criticalAlerts: data.critical_alerts ?? prev.criticalAlerts,
          highAlerts: data.high_alerts ?? prev.highAlerts,
          mediumAlerts: data.medium_alerts ?? prev.mediumAlerts,
          lowAlerts: data.low_alerts ?? prev.lowAlerts,
          refreshInterval: data.refresh_interval ?? prev.refreshInterval,
          theme: data.theme ?? prev.theme,
          language: data.language ?? prev.language,
        }))
      }
    })
    return () => { isMounted = false }
  }, [])

  // Ensure active theme is applied
  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  // Sync language with context
  useEffect(() => {
    setSettings((prev) => ({ ...prev, language: currentLang }))
  }, [currentLang])

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleThemeChange = (newTheme) => {
    updateSetting('theme', newTheme)
    applyTheme(newTheme)
  }

  const handleLanguageChange = (newLang) => {
    updateSetting('language', newLang)
    setLanguage(newLang)
  }

  const handleSave = async () => {
    setSavedNotice(true)
    // Persist to Supabase
    try {
      await saveUserSettings({
        monitoring: settings.monitoring,
        show_camera_markers: settings.showCameraMarkers,
        show_camera_labels: settings.showCameraLabels,
        show_traffic_density: settings.showTrafficDensity,
        auto_center_map: settings.autoCenterMap,
        critical_alerts: settings.criticalAlerts,
        high_alerts: settings.highAlerts,
        medium_alerts: settings.mediumAlerts,
        low_alerts: settings.lowAlerts,
        refresh_interval: settings.refreshInterval,
        theme: settings.theme,
        language: settings.language,
      })
    } catch (err) {
      console.warn('Failed to save settings to Supabase:', err)
    }
    setTimeout(() => setSavedNotice(false), 3000)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    applyTheme(DEFAULT_SETTINGS.theme)
    setLanguage(DEFAULT_SETTINGS.language)
  }

  return (
    <DashboardLayout title={t('systemSettings')}>
      <div className="space-y-6 max-w-[1100px] mx-auto">

        {/* ── Page Header ── */}
        <div className="bg-[#091022]/95 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
              <SettingsIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                  {t('systemSettings')}
                </h1>
                <span className="text-[10px] bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded font-mono font-bold border border-cyan-500/30 uppercase">
                  {t('operatorProfile')}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t('settingsSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-lg bg-[#070c18] hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>{t('defaults')}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/25 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{t('saveChanges')}</span>
            </button>
          </div>
        </div>

        {/* ── Save Confirmation Banner ── */}
        {savedNotice && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-md">
            <ShieldCheck size={16} />
            <span>{t('settingsSavedNotice')}</span>
          </div>
        )}

        {/* ── Settings Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ━━━ 1. System Status ━━━ */}
          <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <SectionHeader icon={Radio} label={t('systemStatus')} iconColor="text-emerald-400" />

            <div className="space-y-1 text-xs">
              <SettingRow
                label={t('monitoringStatus')}
                description={t('monitoringDesc')}
              >
                <Toggle
                  id="monitoring-toggle"
                  checked={settings.monitoring}
                  onChange={(e) => updateSetting('monitoring', e.target.checked)}
                  accentColor="emerald"
                />
              </SettingRow>

              {/* Status display */}
              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.monitoring ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${settings.monitoring ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </span>
                <span className={`font-mono font-bold text-xs ${settings.monitoring ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {settings.monitoring ? t('monitoringActive') : t('monitoringPaused')}
                </span>
              </div>
            </div>
          </div>

          {/* ━━━ 2. Map Display ━━━ */}
          <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <SectionHeader icon={Map} label={t('mapDisplaySettings')} iconColor="text-cyan-400" />

            <div className="space-y-2 text-xs divide-y divide-slate-800/50">
              <SettingRow label={t('showCameraMarkers')} description={t('showCameraMarkersDesc')}>
                <Toggle
                  id="camera-markers"
                  checked={settings.showCameraMarkers}
                  onChange={(e) => updateSetting('showCameraMarkers', e.target.checked)}
                  accentColor="cyan"
                />
              </SettingRow>
              <SettingRow label={t('showCameraLabels')} description={t('showCameraLabelsDesc')} className="pt-2">
                <Toggle
                  id="camera-labels"
                  checked={settings.showCameraLabels}
                  onChange={(e) => updateSetting('showCameraLabels', e.target.checked)}
                  accentColor="cyan"
                />
              </SettingRow>
              <SettingRow label={t('showTrafficDensity')} description={t('showTrafficDensityDesc')} className="pt-2">
                <Toggle
                  id="traffic-density"
                  checked={settings.showTrafficDensity}
                  onChange={(e) => updateSetting('showTrafficDensity', e.target.checked)}
                  accentColor="emerald"
                />
              </SettingRow>
              <SettingRow label={t('autoCenterMap')} description={t('autoCenterMapDesc')} className="pt-2">
                <Toggle
                  id="auto-center"
                  checked={settings.autoCenterMap}
                  onChange={(e) => updateSetting('autoCenterMap', e.target.checked)}
                  accentColor="amber"
                />
              </SettingRow>
            </div>
          </div>

          {/* ━━━ 3. Alert Preferences ━━━ */}
          <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <SectionHeader icon={Bell} label={t('alertPreferences')} iconColor="text-rose-400" />

            <div className="space-y-2 text-xs divide-y divide-slate-800/50">
              <SettingRow
                label={<span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />{t('criticalAlerts')}</span>}
                description={t('criticalAlertsDesc')}
              >
                <Toggle
                  id="alert-critical"
                  checked={settings.criticalAlerts}
                  onChange={(e) => updateSetting('criticalAlerts', e.target.checked)}
                  accentColor="rose"
                />
              </SettingRow>
              <SettingRow
                label={<span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{t('highPriorityAlerts')}</span>}
                description={t('highPriorityAlertsDesc')}
                className="pt-2"
              >
                <Toggle
                  id="alert-high"
                  checked={settings.highAlerts}
                  onChange={(e) => updateSetting('highAlerts', e.target.checked)}
                  accentColor="amber"
                />
              </SettingRow>
              <SettingRow
                label={<span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />{t('mediumPriorityAlerts')}</span>}
                description={t('mediumPriorityAlertsDesc')}
                className="pt-2"
              >
                <Toggle
                  id="alert-medium"
                  checked={settings.mediumAlerts}
                  onChange={(e) => updateSetting('mediumAlerts', e.target.checked)}
                  accentColor="cyan"
                />
              </SettingRow>
              <SettingRow
                label={<span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />{t('lowPriorityAlerts')}</span>}
                description={t('lowPriorityAlertsDesc')}
                className="pt-2"
              >
                <Toggle
                  id="alert-low"
                  checked={settings.lowAlerts}
                  onChange={(e) => updateSetting('lowAlerts', e.target.checked)}
                  accentColor="cyan"
                />
              </SettingRow>
            </div>
          </div>

          {/* ━━━ 4. Data Refresh ━━━ */}
          <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <SectionHeader icon={RefreshCw} label={t('dataRefreshInterval')} iconColor="text-amber-400" />

            <div className="space-y-4 text-xs">
              <SettingRow
                label={t('refreshInterval')}
                description={t('refreshIntervalDesc')}
              >
                <SettingSelect
                  value={settings.refreshInterval}
                  onChange={(val) => updateSetting('refreshInterval', val)}
                  options={[
                    { value: '10s', label: '10 seconds' },
                    { value: '30s', label: '30 seconds' },
                    { value: '1m',  label: '1 minute'   },
                    { value: '5m',  label: '5 minutes'  },
                  ]}
                />
              </SettingRow>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>{t('activeServerEngine')}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {t('connectedLocalPrototype')}
                </span>
              </div>
            </div>
          </div>

          {/* ━━━ 5. Interface ━━━ */}
          <div className="bg-[#091022]/90 border border-slate-800 rounded-xl p-5 shadow-xl lg:col-span-2">
            <SectionHeader icon={Monitor} label={t('interfacePreferences')} iconColor="text-indigo-400" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-200 mb-1">{t('theme')}</div>
                <div className="text-[11px] text-slate-500 mb-2">{t('themeDesc')}</div>
                <SettingSelect
                  value={settings.theme}
                  onChange={handleThemeChange}
                  options={[
                    { value: 'Dark',   label: 'Dark'   },
                    { value: 'Light',  label: 'Light'  },
                    { value: 'System', label: 'System' },
                  ]}
                />
              </div>
              <div>
                <div className="font-semibold text-slate-200 mb-1">{t('density')}</div>
                <div className="text-[11px] text-slate-500 mb-2">{t('densityDesc')}</div>
                <SettingSelect
                  value={settings.density}
                  onChange={(val) => updateSetting('density', val)}
                  options={[
                    { value: 'Comfortable', label: 'Comfortable' },
                    { value: 'Compact',     label: 'Compact'     },
                  ]}
                />
              </div>
              <div>
                <div className="font-semibold text-slate-200 mb-1">{t('language')}</div>
                <div className="text-[11px] text-slate-500 mb-2">{t('languageDesc')}</div>
                <SettingSelect
                  value={settings.language}
                  onChange={handleLanguageChange}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Hindi',   label: 'Hindi (हिंदी)' },
                  ]}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom Save Bar ── */}
        <div className="flex items-center justify-between gap-4 bg-[#091022]/80 border border-slate-800 rounded-xl px-5 py-4 shadow-xl">
          <p className="text-xs text-slate-400 font-mono">
            {t('changesAppliedLocally')}
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/25 flex items-center gap-2"
          >
            <Check size={16} />
            <span>{t('saveChanges')}</span>
          </button>
        </div>

      </div>
    </DashboardLayout>
  )
}
