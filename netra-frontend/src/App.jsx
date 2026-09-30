import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Alerts from './pages/Alerts'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import LiveMap from './pages/LiveMap'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Vehicles from './pages/Vehicles'
import Settings from './pages/Settings'
import TrafficPrevention from './pages/TrafficPrevention'
import { applyTheme, getCurrentThemePreference } from './utils/theme'

export default function App() {
  useEffect(() => {
    applyTheme(getCurrentThemePreference())
  }, [])

  return (
    <Routes>
      {/* Default: redirect root to /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login"  element={<Login />}  />
      <Route path="/signup" element={<SignUp />} />

      {/* App pages */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/map"       element={<LiveMap />}   />
      <Route path="/vehicles"  element={<Vehicles />}  />
      <Route path="/alerts"    element={<Alerts />}    />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/prevention" element={<TrafficPrevention />} />
      <Route path="/settings"  element={<Settings />}  />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
