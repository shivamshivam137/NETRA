import { Building2, Eye, EyeOff, Lock, ShieldCheck, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'

import { loginPersonnel } from '../services/api'

/* ─── Validation ────────────────────────────────────────────────────────────── */
function validate(orgId, password) {
  const errors = {}
  if (!orgId.trim()) errors.orgId = 'Organization ID or Email is required'
  if (!password) errors.password = 'Password is required'
  return errors
}

/* ─── Login Page ────────────────────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate()

  const [orgId, setOrgId]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [errors, setErrors]       = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(orgId, password)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      await loginPersonnel({ orgIdOrEmail: orgId, password })
      navigate('/dashboard')
    } catch (err) {
      setErrors({ general: err.message || 'Authentication failed. Please verify your credentials.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {/* Card */}
      <div className="bg-[#0d1626]/80 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-8 shadow-2xl shadow-black/40">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to access the command center</p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          {/* Organization ID */}
          <AuthInput
            id="orgId"
            label="Organization ID"
            type="text"
            placeholder="Enter organization ID"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            error={errors.orgId}
            icon={Building2}
            autoComplete="organization"
          />

          {/* Password */}
          <AuthInput
            id="password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={Lock}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              >
                {showPw ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
              </button>
            }
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full py-3 rounded-lg font-semibold text-sm text-white tracking-wide
              bg-gradient-to-r from-cyan-600 to-blue-600
              hover:from-cyan-500 hover:to-blue-500
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg shadow-cyan-700/20
              flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Spinner />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Quick Demo Access */}
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setOrgId('NETRA-HQ-01')
              setPassword('Command#2026')
              setSubmitting(true)
              try {
                await loginPersonnel({ orgIdOrEmail: 'NETRA-HQ-01', password: 'Command#2026' })
                navigate('/dashboard')
              } catch (err) {
                setErrors({ general: err.message })
              } finally {
                setSubmitting(false)
              }
            }}
            className="w-full py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>⚡ Quick Demo Login</span>
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&rsquo;t have an account?{' '}
          <Link
            to="/signup"
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>

      {/* Security notice */}
      <div className="mt-5 flex items-center justify-center gap-2 text-slate-600 text-xs select-none">
        <ShieldCheck size={13} strokeWidth={1.8} />
        <span>Secure access · Authorized personnel only</span>
      </div>
    </AuthLayout>
  )
}

/* ─── Inline spinner ─────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
