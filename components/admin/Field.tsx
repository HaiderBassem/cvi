'use client';

import React, { useId } from 'react';
import { cx } from './ui';

/**
 * Labelled form controls with inline errors wired for screen readers
 * (aria-invalid + aria-describedby) and an optional live character count.
 */

interface BaseProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
}

const control =
  'w-full rounded-md border bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 transition-colors ' +
  'focus:outline-none focus:border-skyblue focus:ring-1 focus:ring-skyblue/40';

function Shell({
  id,
  label,
  hint,
  error,
  required,
  counter,
  className,
  children,
}: BaseProps & { id: string; counter?: string; children: React.ReactNode }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-white/80">
          {label}
          {required && <span className="text-skyblue"> *</span>}
        </label>
        {counter && <span className="font-mono text-[10px] text-white/35 tabular-nums">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-white/40">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  required,
  maxLength,
  className,
  value,
  onChange,
  ...rest
}: BaseProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
    value: string;
    onChange: (v: string) => void;
  }) {
  const id = useId();
  return (
    <Shell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      counter={maxLength ? `${value.length}/${maxLength}` : undefined}
    >
      <input
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cx(control, error ? 'border-red-400/60' : 'border-white/10')}
        {...rest}
      />
    </Shell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  required,
  maxLength,
  className,
  value,
  onChange,
  rows = 4,
  ...rest
}: BaseProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
    value: string;
    onChange: (v: string) => void;
  }) {
  const id = useId();
  return (
    <Shell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      counter={maxLength ? `${value.length}/${maxLength}` : undefined}
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cx(control, 'resize-y leading-relaxed', error ? 'border-red-400/60' : 'border-white/10')}
        {...rest}
      />
    </Shell>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-white/10 bg-black/20 px-3 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm text-white cursor-pointer">
          {label}
        </label>
        {description && <p className="text-xs text-white/45 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative shrink-0 w-10 h-6 rounded-full transition-colors cursor-pointer',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue',
          checked ? 'bg-skyblue' : 'bg-white/15'
        )}
      >
        <span
          aria-hidden="true"
          className={cx('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')}
        />
      </button>
    </div>
  );
}

/** Titled group of fields inside a drawer or page. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-skyblue">{title}</h3>
        {description && <p className="text-xs text-white/45 mt-1">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
