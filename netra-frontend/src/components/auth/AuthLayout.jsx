/**
 * AuthLayout.jsx
 * Shared two-column layout for Login and Sign Up pages.
 * Left panel: NETRA branding + tagline.
 * Right panel: the form card.
 */

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-[#0b0f1a]">
      {/* ── Left branding panel (hidden on mobile/tablet) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e] via-[#0b1628] to-[#06090f]" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-[-120px] left-[-80px] w-[420px] h-[420px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[320px] h-[320px] rounded-full bg-blue-700/8 blur-[80px] pointer-events-none" />

        {/* Top: logo */}
        <div className="relative z-10">
          <BrandMark />
        </div>

        {/* Middle: hero text */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
            City-Wide<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Traffic Intelligence
            </span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            Monitor, analyze, and respond to traffic events across the entire urban network — in real time.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 pt-2">
            {[
              'ANPR · License plate recognition',
              'Multi-camera trajectory tracking',
              'Real-time incident alerting',
              'Analytics & compliance reports',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: classification badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-400 tracking-widest uppercase">
              Authorized Access Only
            </span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-y-auto">
        {/* Subtle radial glow behind the card */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(14,165,233,0.04),transparent)] pointer-events-none" />

        {/* Mobile brand (only visible < lg) */}
        <div className="lg:hidden mb-8">
          <BrandMark />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          {children}
        </div>

        <p className="relative z-10 mt-8 text-xs text-slate-600 text-center select-none">
          © {new Date().getFullYear()} NETRA Command Center · All rights reserved
        </p>
      </div>
    </div>
  )
}

/* ─── Shared brand mark ─────────────────────────────────────────────────────── */
function BrandMark() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        {/* Icon mark */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          </svg>
        </div>
        <span className="text-2xl font-bold tracking-[0.15em] text-white">NETRA</span>
      </div>
      <p className="text-[11px] font-medium tracking-[0.18em] text-slate-500 uppercase pl-[46px]">
        Intelligent Urban Command Center
      </p>
    </div>
  )
}
