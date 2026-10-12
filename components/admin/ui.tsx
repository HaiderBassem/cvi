'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Admin UI primitives. One look for every admin screen: basalt surfaces,
 * hairline borders, mono labels and a single sky-blue action colour.
 * Red is reserved for actions that destroy something.
 */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-skyblue text-black font-semibold hover:bg-skyblue-light',
  secondary: 'border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/25',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[0.06]',
  subtle: 'border border-skyblue/30 bg-skyblue/10 text-skyblue hover:bg-skyblue/15',
  danger: 'bg-red-500/90 text-white font-semibold hover:bg-red-500',
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: 'sm' | 'md';
    loading?: boolean;
  }
>(function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full transition-colors cursor-pointer whitespace-nowrap',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-sm',
        VARIANTS[variant],
        focusRing,
        className
      )}
      {...rest}
    >
      {loading && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className,
  children,
  tone = 'default',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
        tone === 'danger' ? 'text-white/50 hover:text-red-400 hover:bg-red-500/10' : 'text-white/60 hover:text-white hover:bg-white/[0.08]',
        focusRing,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-lg border border-white/10 bg-[#111116]', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, description }: { title: string; action?: React.ReactNode; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {description && <p className="text-xs text-white/50 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/55">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

type Tone = 'accent' | 'success' | 'neutral' | 'warning' | 'danger';
const TONES: Record<Tone, string> = {
  accent: 'border-skyblue/35 bg-skyblue/10 text-skyblue',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  neutral: 'border-white/15 bg-white/[0.04] text-white/65',
  warning: 'border-orange-300/30 bg-orange-300/10 text-orange-200',
  danger: 'border-red-400/30 bg-red-500/10 text-red-300',
};

export function StatusChip({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wider', TONES[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-3 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/45" aria-hidden="true">
        {icon}
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-white/50 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="divide-y divide-white/5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
          <div className="w-8 h-8 rounded-md bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-white/[0.07]" />
            <div className="h-2.5 w-1/2 rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Modal confirm. Focus starts on the safe choice; Escape cancels. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancelRef.current();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/75" aria-hidden="true" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-md rounded-lg border border-white/15 bg-[#14141a] p-6 shadow-2xl"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-white/65 leading-relaxed">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { cx, focusRing };
