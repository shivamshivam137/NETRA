/**
 * AuthInput.jsx
 * Reusable labeled input for authentication forms.
 */

export default function AuthInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  rightElement,
  autoComplete,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide text-slate-400 uppercase"
      >
        {label}
      </label>

      <div className="relative group">
        {/* Left icon */}
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200 pointer-events-none">
            <Icon size={16} strokeWidth={1.8} />
          </span>
        )}

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={[
            'w-full rounded-lg border bg-[#0d1626] text-slate-100 text-sm placeholder-slate-600',
            'py-3 pr-4 transition-all duration-200 outline-none',
            Icon ? 'pl-10' : 'pl-4',
            rightElement ? 'pr-11' : '',
            error
              ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
              : 'border-slate-700/60 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10 hover:border-slate-600',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {/* Right slot (e.g. visibility toggle) */}
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        )}
      </div>

      {/* Validation message */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5" role="alert">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
