'use client';

import React, { useId, useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react';

const TYPOLOGIES = [
  'Masterplanning & Urban Design',
  'Residential High-Rise / Tower',
  'Educational or Academic Campus',
  'Commercial / Corporate HQ',
  'Cultural or Religious Architecture',
  'Bespoke Private Villa',
  'Other',
];

const EMPTY = { name: '', email: '', typology: TYPOLOGIES[0], scale: '', message: '', website: '' };

type Key = keyof typeof EMPTY;
type FieldErrors = Partial<Record<Key, string>>;

const inputBase =
  'w-full bg-white/5 border rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-skyblue transition-colors';
const labelClass = 'block font-mono text-[11px] text-white/60 mb-2 uppercase';

export default function ContactForm() {
  const uid = useId();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState<{ name: string } | null>(null);

  const id = (k: string) => `${uid}-${k}`;
  const set = (k: Key, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    setFormError(null);
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = 'Please tell us your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address so we can reply.';
    if (form.message.trim().length < 10) e.message = 'Tell us a little more about the project (at least 10 characters).';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const local = validate();
    if (Object.keys(local).length) {
      setErrors(local);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-contact-form] [aria-invalid="true"]')?.focus());
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        if (body.fieldErrors) setErrors(body.fieldErrors);
        setFormError(body.error || 'Your message could not be sent. Please try again.');
        return;
      }
      setSent({ name: form.name.trim() });
      setForm(EMPTY);
    } catch {
      setFormError('We could not reach the server. Check your connection and try again — nothing you typed was lost.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="border border-white/20 p-8 sm:p-12 rounded-sm bg-white/[0.02] text-center flex flex-col items-center" role="status">
        <div className="w-12 h-12 rounded-full border border-skyblue/40 bg-skyblue/10 flex items-center justify-center text-skyblue mb-6">
          <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">Brief received</div>
        <h4 className="text-xl sm:text-2xl font-display text-white mb-3">Thank you, {sent.name}.</h4>
        <p className="text-white/70 text-sm font-light max-w-md mx-auto mb-8 leading-relaxed">
          Your project brief has reached the CVI studio. We&apos;ll reply to the email address you gave us.
        </p>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="font-mono text-xs uppercase tracking-widest text-white/60 hover:text-skyblue transition-colors underline underline-offset-4 cursor-pointer"
        >
          Send another brief
        </button>
      </div>
    );
  }

  const field = (k: Key) => ({
    id: id(k),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? id(`${k}-err`) : undefined,
  });

  const errorFor = (k: Key) =>
    errors[k] ? (
      <p id={id(`${k}-err`)} className="mt-1.5 text-xs text-red-300">
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="border border-white/10 p-8 sm:p-12 rounded-sm bg-white/[0.01]">
      <h3 className="card-title font-display text-white mb-2">Send an Architectural Brief</h3>
      <p className="text-white/60 text-xs font-mono mb-8 tracking-wider uppercase">Read by the studio directors</p>

      <form onSubmit={handleSubmit} noValidate data-contact-form className="relative flex flex-col gap-6">
        {formError && (
          <div role="alert" className="flex gap-3 rounded-sm border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-sm text-white">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-300" aria-hidden="true" />
            <p>{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor={id('name')} className={labelClass}>
              Full name *
            </label>
            <input
              {...field('name')}
              type="text"
              autoComplete="name"
              maxLength={120}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={`${inputBase} ${errors.name ? 'border-red-400/60' : 'border-white/10'}`}
            />
            {errorFor('name')}
          </div>
          <div>
            <label htmlFor={id('email')} className={labelClass}>
              Email address *
            </label>
            <input
              {...field('email')}
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={200}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@organization.com"
              className={`${inputBase} ${errors.email ? 'border-red-400/60' : 'border-white/10'}`}
            />
            {errorFor('email')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor={id('typology')} className={labelClass}>
              Project type
            </label>
            <select
              {...field('typology')}
              value={form.typology}
              onChange={(e) => set('typology', e.target.value)}
              className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-skyblue transition-colors"
            >
              {TYPOLOGIES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={id('scale')} className={labelClass}>
              Estimated scale / location
            </label>
            <input
              {...field('scale')}
              type="text"
              maxLength={120}
              value={form.scale}
              onChange={(e) => set('scale', e.target.value)}
              placeholder="e.g. 25,000 m² / Najaf"
              className={`${inputBase} border-white/10`}
            />
          </div>
        </div>

        <div>
          <label htmlFor={id('message')} className={labelClass}>
            Project description &amp; requirements *
          </label>
          <textarea
            {...field('message')}
            rows={5}
            maxLength={5000}
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            placeholder="Site conditions, vision, programme and target timeline…"
            className={`${inputBase} ${errors.message ? 'border-red-400/60' : 'border-white/10'}`}
          />
          {errorFor('message')}
        </div>

        {/* Honeypot — hidden from people and assistive tech; bots fill it */}
        <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
          <label htmlFor={id('website')}>Website</label>
          <input id={id('website')} type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-black font-mono text-xs tracking-widest font-semibold hover:bg-skyblue transition-all cursor-pointer mt-2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>SENDING…</span>
            </>
          ) : (
            <>
              <span>SEND BRIEF</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
