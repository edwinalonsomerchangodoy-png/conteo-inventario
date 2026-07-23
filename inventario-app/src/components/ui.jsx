export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-black/5 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Eyebrow({ children }) {
  return (
    <p className="code-tag text-[11px] tracking-widest text-slate-soft uppercase mb-1">
      {children}
    </p>
  )
}

export function Badge({ tone = 'ok', children }) {
  const tones = {
    ok: 'bg-ok/10 text-ok border-ok/20',
    warn: 'bg-warn/10 text-warn border-warn/20',
    bad: 'bg-bad/10 text-bad border-bad/20',
    neutral: 'bg-ink/5 text-ink border-ink/10',
    pending: 'bg-signal/10 text-signal-dim border-signal/30',
    flag: 'bg-purple-500/10 text-purple-700 border-purple-500/25',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-soft mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-soft/70 focus:border-signal transition-colors'
