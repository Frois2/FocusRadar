import { Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

/* ─── Card ──────────────────────────────────────────────────────────── */
export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

/* ─── CardHeader ─────────────────────────────────────────────────────── */
export function CardHeader({ label, title, children }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
      <div className="min-w-0">
        {label && <p className="label mb-1">{label}</p>}
        <h3 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {title}
        </h3>
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, accentColor = 'var(--accent)', delta, deltaLabel }) {
  const isPos = delta !== null && delta !== undefined && delta >= 0;
  return (
    <div
      className="card relative overflow-hidden group"
      style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Top glow line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}70, transparent)` }}
      />
      {/* Background glow */}
      <div
        className="absolute top-0 left-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)`, transform: 'translate(-30%, -30%)' }}
      />

      <p className="label mb-2.5">{label}</p>
      <p className="text-3xl font-black tracking-tight leading-none" style={{ color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {delta !== null && delta !== undefined ? (
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: isPos ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              color: isPos ? 'var(--green)' : 'var(--red)',
              border: `1px solid ${isPos ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {isPos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {Math.abs(delta)}%
          </span>
          {deltaLabel && (
            <span className="text-[11px]" style={{ color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
              {deltaLabel}
            </span>
          )}
        </div>
      ) : sub ? (
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────── */
export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block label mb-1.5">{label}</label>
      )}
      <input className="input-base" {...props} />
      {hint && (
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs mt-1" style={{ color: 'var(--red)', fontFamily: "'JetBrains Mono', monospace" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────────────────── */
export function Select({ label, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block label mb-1.5">{label}</label>}
      <select className="input-base" style={{ cursor: 'pointer' }} {...props}>
        {children}
      </select>
    </div>
  );
}

/* ─── Textarea ───────────────────────────────────────────────────────── */
export function Textarea({ label, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block label mb-1.5">{label}</label>}
      <textarea className="input-base" style={{ resize: 'none' }} {...props} />
    </div>
  );
}

/* ─── SliderField ────────────────────────────────────────────────────── */
export function SliderField({ label, id, value, onChange, min = 1, max = 5 }) {
  const pct = ((value - min) / (max - min)) * 100;
  const labels = { 1: 'Muito baixo', 2: 'Baixo', 3: 'Médio', 4: 'Alto', 5: 'Muito alto' };

  return (
    <div>
      <div className="flex justify-between mb-2.5 items-center">
        <label htmlFor={id} className="label">{label}</label>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(77,124,255,0.1)',
              color: 'var(--accent-2)',
              border: '1px solid rgba(77,124,255,0.2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {labels[value] || value}
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--accent-2)', fontFamily: "'JetBrains Mono', monospace", minWidth: '28px', textAlign: 'right' }}
          >
            {value}/{max}
          </span>
        </div>
      </div>

      <div className="relative h-2 rounded-full" style={{ background: 'var(--surface-3)' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
        />
        <input
          id={id} type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '100%' }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <div key={n} className="flex flex-col items-center gap-1">
            <div
              className="w-1 h-1 rounded-full transition-all duration-150"
              style={{ background: n <= value ? 'var(--accent)' : 'var(--surface-3)' }}
            />
            <span
              className="text-[10px]"
              style={{ color: n <= value ? 'var(--accent-2)' : 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {n}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-lg animate-scale-in overflow-y-auto"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-2)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 24px 32px',
          maxHeight: '92vh',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-2)' }} />
        </div>

        <div
          className="hidden sm:block w-full"
          style={{
            borderRadius: '16px 16px 0 0',
          }}
        />
        <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>{title}</h2>
        {subtitle && <p className="label mt-1 mb-5">{subtitle}</p>}
        <div className={subtitle ? '' : 'mt-4'}>{children}</div>
      </div>
    </div>
  );
}

/* ─── EmptyState ─────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      {Icon && <Icon size={28} strokeWidth={1.3} style={{ color: 'var(--text-3)', marginBottom: '8px' }} />}
      <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{title}</p>
      <p
        className="text-xs max-w-xs leading-relaxed"
        style={{ color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ─── PageHeader ─────────────────────────────────────────────────────── */
export function PageHeader({ title, titleAccent, subtitle, children }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
        {title}{' '}
        {titleAccent && (
          <span style={{ color: 'var(--accent-2)' }}>{titleAccent}</span>
        )}
      </h1>
      {subtitle && (
        <p className="label mt-1.5">{subtitle}</p>
      )}
      {children && (
        <div className="flex flex-wrap gap-2 mt-4">{children}</div>
      )}
    </div>
  );
}

/* ─── Spinner ────────────────────────────────────────────────────────── */
export function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin" style={{ color: 'var(--text-3)' }} />;
}

/* ─── Badge ──────────────────────────────────────────────────────────── */
export function Badge({ children, variant = 'blue' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

/* ─── PinInput ───────────────────────────────────────────────────────── */
export function PinInput({ value, onChange, length = 6 }) {
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  function handleKey(e, idx) {
    const key = e.key;
    if (key === 'Backspace') {
      e.preventDefault();
      const next = value.slice(0, Math.max(0, idx === value.length ? idx - 1 : idx));
      onChange(next);
      const prev = document.getElementById(`pin-${idx - 1}`);
      if (prev && idx > 0) prev.focus();
      return;
    }
    if (key === 'ArrowLeft' && idx > 0) { document.getElementById(`pin-${idx - 1}`)?.focus(); return; }
    if (key === 'ArrowRight' && idx < length - 1) { document.getElementById(`pin-${idx + 1}`)?.focus(); return; }
    if (/^\d$/.test(key)) {
      e.preventDefault();
      const arr = value.split('');
      arr[idx] = key;
      const next = arr.slice(0, length).join('').replace(/\s/g, '');
      onChange(next.slice(0, length));
      if (idx < length - 1) document.getElementById(`pin-${idx + 1}`)?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    document.getElementById(`pin-${focusIdx}`)?.focus();
  }

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`pin-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          readOnly
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`pin-digit ${d ? 'filled' : ''}`}
        />
      ))}
    </div>
  );
}

/* ─── WeeklyGoalBar ──────────────────────────────────────────────────── */
export function WeeklyGoalBar({ current, goal, label = 'Meta semanal' }) {
  const pct = Math.min((current / goal) * 100, 100);
  const over = current > goal;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="label">{label}</span>
        <span
          className="text-xs font-bold"
          style={{
            color: over ? 'var(--green)' : 'var(--text-2)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {current.toFixed(0)}h / {goal}h
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: over
              ? 'linear-gradient(90deg, var(--green), #2dd4bf)'
              : 'linear-gradient(90deg, var(--accent), var(--accent-2))',
            boxShadow: over ? '0 0 8px rgba(52,211,153,0.4)' : '0 0 8px rgba(77,124,255,0.4)',
          }}
        />
        {/* Goal marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5"
          style={{
            left: '100%',
            background: 'var(--border-3)',
            display: pct >= 100 ? 'none' : 'block',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>0h</span>
        <span className="text-[10px]" style={{ color: over ? 'var(--green)' : 'var(--text-3)', fontFamily: 'monospace' }}>
          {over ? `+${(current - goal).toFixed(1)}h além da meta 🎯` : `${(goal - current).toFixed(1)}h restantes`}
        </span>
      </div>
    </div>
  );
}

/* ─── StreakBadge ────────────────────────────────────────────────────── */
export function StreakBadge({ days }) {
  if (!days) return null;
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.05))',
        border: '1px solid rgba(251,191,36,0.2)',
      }}
    >
      <span className="text-base">🔥</span>
      <div>
        <p
          className="text-xs font-black leading-none"
          style={{ color: 'var(--amber)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {days} dias
        </p>
        <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--text-3)' }}>
          sequência
        </p>
      </div>
    </div>
  );
}

/* ─── PomodoroTimer ──────────────────────────────────────────────────── */
export function PomodoroTimer() {
  const MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const MODE_LABELS = { work: 'Foco', short: 'Pausa curta', long: 'Pausa longa' };
  const [mode, setMode] = useState('work');
  const [seconds, setSeconds] = useState(MODES.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === 'work') setSessions(n => n + 1);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  function switchMode(m) {
    setMode(m);
    setSeconds(MODES[m]);
    setRunning(false);
  }

  function reset() { setSeconds(MODES[mode]); setRunning(false); }

  const total = MODES[mode];
  const pct = seconds / total;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const strokeColor = mode === 'work' ? 'var(--accent)' : mode === 'short' ? 'var(--teal)' : 'var(--purple)';

  return (
    <div className="card">
      <CardHeader label="Timer" title="Pomodoro" />

      {/* Mode tabs */}
      <div
        className="flex rounded-xl p-1 mb-5"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        {Object.entries(MODE_LABELS).map(([m, l]) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{
              background: mode === m ? 'var(--surface-2)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text-3)',
              border: mode === m ? '1px solid var(--border-2)' : '1px solid transparent',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="6"
            />
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="timer-ring"
              style={{ filter: `drop-shadow(0 0 8px ${strokeColor}60)` }}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ transform: 'rotate(0)' }}
          >
            <span
              className="text-3xl font-black tracking-tight"
              style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}
            >
              {mm}:{ss}
            </span>
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
              {MODE_LABELS[mode]}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="btn-ghost"
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            ↺ Reset
          </button>
          <button
            onClick={() => setRunning(r => !r)}
            className="btn-primary"
            style={{ padding: '7px 20px', fontSize: '12px', minWidth: '80px' }}
          >
            {running ? '⏸ Pausar' : '▶ Iniciar'}
          </button>
        </div>

        {sessions > 0 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(sessions, 8) }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: (i + 1) % 4 === 0 ? 'var(--amber)' : 'var(--accent)',
                  boxShadow: `0 0 4px ${(i + 1) % 4 === 0 ? 'rgba(251,191,36,0.5)' : 'rgba(77,124,255,0.5)'}`,
                }}
              />
            ))}
            <span className="text-[10px] ml-1" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>
              {sessions} sessão{sessions !== 1 ? 'ões' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MoodRing ───────────────────────────────────────────────────────── */
export function MoodRing({ value, size = 48 }) {
  const colors = ['', '#f87171', '#fbbf24', '#a78bfa', '#34d399', '#2dd4bf'];
  const labels = ['', '😞', '😕', '😐', '🙂', '😄'];
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[value]}22, ${colors[value]}08)`,
        border: `1.5px solid ${colors[value]}40`,
      }}
    >
      <span style={{ fontSize: size * 0.42 }}>{labels[value] || '?'}</span>
    </div>
  );
}