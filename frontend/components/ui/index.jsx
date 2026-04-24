'use client';
import clsx from 'clsx';
import { STATUS_MAP } from '../../lib/constants';

// ─── Button ───────────────────────────────────────────────────────────────

export function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  className,
  disabled,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 select-none';

  const variants = {
    primary  : 'bg-primary-container text-on-primary-container hover:opacity-90 active:scale-[0.98] shadow-sm',
    secondary: 'bg-secondary-container text-on-secondary-container hover:opacity-90 active:scale-[0.98]',
    ghost    : 'text-primary hover:bg-primary/5 active:bg-primary/10',
    danger   : 'bg-error-container text-error hover:opacity-90',
    surface  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
  };

  const sizes = {
    sm : 'px-4 py-2 text-sm',
    md : 'px-6 py-3 text-sm',
    lg : 'px-8 py-4 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], disabled && 'opacity-50 cursor-not-allowed', className)}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────

export function Input({ label, error, icon, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={clsx(
            'input-field',
            icon && 'pl-10',
            error && 'border-error/50 bg-error-container/20',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────

export function Select({ label, error, options = [], placeholder, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'input-field appearance-none cursor-pointer',
          error && 'border-error/50',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        className={clsx('input-field resize-none min-h-[100px]', error && 'border-error/50', className)}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg
      className={clsx('animate-spin text-current', sizes[size], className)}
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const map = STATUS_MAP[status] ?? { label: status, color: 'badge-pending', icon: 'circle' };
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-bold uppercase tracking-wider', map.color)}>
      <span className="material-symbols-outlined text-sm">{map.icon}</span>
      {map.label}
    </span>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-outline">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-on-surface">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ─── AlertBanner ─────────────────────────────────────────────────────────

export function AlertBanner({ type = 'error', message, onDismiss }) {
  const styles = {
    error   : 'bg-error-container text-error border-error/20',
    success : 'bg-secondary-container/40 text-secondary border-secondary/20',
    info    : 'bg-primary-fixed/30 text-primary border-primary/20',
  };
  const icons  = { error: 'error', success: 'check_circle', info: 'info' };

  if (!message) return null;

  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-in', styles[type])}>
      <span className="material-symbols-outlined text-lg">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}
