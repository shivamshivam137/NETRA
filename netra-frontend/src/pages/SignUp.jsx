import { Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, User, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'

import { signUpPersonnel } from '../services/api'

/* ─── Validation ────────────────────────────────────────────────────────────── */
function validate(fields) {
  const { fullName, orgId, email, password, confirmPassword } = fields
  const errors = {}

  if (!fullName.trim())
    errors.fullName = 'Full name is required'

  if (!orgId.trim())
    errors.orgId = 'Organization ID is required'

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!password)
    errors.password = 'Password is required'
  else if (password.length < 8)
    errors.password = 'Password must be at least 8 characters'

  if (!confirmPassword)
    errors.confirmPassword = 'Please confirm your password'
  else if (password && confirmPassword !== password)
    errors.confirmPassword = 'Passwords do not match'

  return errors
}

/* ─── Sign Up Page ───────────────────────────────────────────────────────────── */
export default function SignUp() {
  const navigate = useNavigate()

  const [fields, setFields] = useState({
    fullName: '',
    orgId: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw]             = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [errors, setErrors]             = useState({})
  const [submitting, setSubmitting]     = useState(false)

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)

    try {
      await signUpPersonnel(fields)
      navigate('/login')
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {/* Card */}
      <div className="bg-[#0d1626]/80 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-8 shadow-2xl shadow-black/40">

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Create Account</h1>
          <p className="text-sm text-slate-500">Register to access the command center</p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* Full Name */}
          <AuthInput
            id="fullName"
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            value={fields.fullName}
            onChange={set('fullName')}
            error={errors.fullName}
            icon={User}
            autoComplete="name"
          />

          {/* Organization ID */}
          <AuthInput
            id="orgId"
            label="Organization ID"
            type="text"
            placeholder="Enter organization ID"
            value={fields.orgId}
            onChange={set('orgId')}
            error={errors.orgId}
            icon={Building2}
            autoComplete="organization"
          />

          {/* Email */}
          <AuthInput
            id="email"
            label="Email"
            type="email"
            placeholder="Enter email address"
            value={fields.email}
            onChange={set('email')}
            error={errors.email}
            icon={Mail}
            autoComplete="email"
          />

          {/* Password */}
          <AuthInput
            id="password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Create password"
            value={fields.password}
            onChange={set('password')}
            error={errors.password}
            icon={Lock}
            autoComplete="new-password"
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

          {/* Confirm Password */}
          <AuthInput
            id="confirmPassword"
            label="Confirm Password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm password"
            value={fields.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            icon={Lock}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              >
                {showConfirm ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
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
              flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Sign In
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
