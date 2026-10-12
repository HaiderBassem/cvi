'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import type { DisciplineRecord, SiteContent, SitePillar } from '@/lib/db/types';
import { adminFetch, ApiError } from '@/components/admin/adminFetch';
import { Button, Card, IconButton, PageHeader, cx } from '@/components/admin/ui';
import { FormBanner, ListSkeleton, LoadFailed } from '@/components/admin/AdminStates';
import { FormSection, TextArea, TextField } from '@/components/admin/Field';
import ImageUpload from '@/components/admin/ImageUpload';
import SaveBar from '@/components/admin/SaveBar';
import { useUnsavedGuard } from '@/components/admin/useUnsavedGuard';

type Tab = 'home' | 'about' | 'disciplines';
type DisciplineDraft = { id?: string; title: string; tagline: string; description: string; image_url: string };

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Homepage' },
  { id: 'about', label: 'About & pillars' },
  { id: 'disciplines', label: 'Disciplines' },
];

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function toDrafts(items: DisciplineRecord[]): DisciplineDraft[] {
  return items.map((d) => ({ id: d.id, title: d.title, tagline: d.tagline || '', description: d.description, image_url: d.image_url }));
}

/** Small, faithful preview of the homepage copy so edits can be judged before saving. */
function HeroPreview({ c }: { c: SiteContent }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#07070a] p-5 overflow-hidden" aria-label="Homepage preview">
      <div className="font-mono text-[9px] text-skyblue tracking-[0.25em] uppercase mb-3 flex items-center gap-2">
        <span className="w-5 h-px bg-skyblue" />
        {c.heroEyebrow || '—'}
      </div>
      <div className="font-display font-bold text-white text-2xl leading-[0.95] tracking-tight">
        {c.heroTitle || 'Headline'} <span className="text-white/40">{c.heroTitleMuted}</span>
      </div>
      <p className="mt-3 text-[11px] text-white/70 leading-relaxed line-clamp-4">{c.heroBody}</p>
      <div className="mt-5 pt-4 border-t border-white/10 text-center">
        <p className="font-display text-sm text-white leading-snug line-clamp-3">&ldquo;{c.manifestoQuote}&rdquo;</p>
        <p className="mt-2 font-mono text-[9px] text-white/45 tracking-widest">{c.manifestoAttribution}</p>
      </div>
      <div className="mt-5 pt-4 border-t border-white/10">
        <div className="font-mono text-[9px] text-skyblue tracking-widest uppercase">{c.teamEyebrow}</div>
        <div className="font-display text-white text-base">{c.teamTitle}</div>
        <p className="text-[11px] text-white/55 line-clamp-2">{c.teamIntro}</p>
      </div>
    </div>
  );
}

export default function SiteContentPage() {
  const [tab, setTab] = useState<Tab>('home');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saved, setSaved] = useState<{ content: SiteContent; disciplines: DisciplineDraft[] } | null>(null);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [disciplines, setDisciplines] = useState<DisciplineDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [c, d] = await Promise.all([
        adminFetch<SiteContent>('/api/admin/site-content'),
        adminFetch<DisciplineRecord[]>('/api/admin/disciplines'),
      ]);
      const drafts = toDrafts(d);
      setSaved({ content: c, disciplines: drafts });
      setContent(c);
      setDisciplines(drafts);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const contentDirty = !!saved && !!content && JSON.stringify(content) !== JSON.stringify(saved.content);
  const disciplinesDirty = !!saved && JSON.stringify(disciplines) !== JSON.stringify(saved.disciplines);
  const dirty = contentDirty || disciplinesDirty;
  const { guard } = useUnsavedGuard(dirty);

  const clearErrors = (keys: string[]) =>
    setErrors((prev) => {
      if (!keys.some((k) => k in prev)) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const patch = (p: Partial<SiteContent>) => {
    setContent((c) => (c ? { ...c, ...p } : c));
    clearErrors(Object.keys(p));
    setFormError(null);
    setNotice(null);
  };

  const patchPillar = (i: number, p: Partial<SitePillar>) => {
    setContent((c) => (c ? { ...c, pillars: c.pillars.map((x, j) => (j === i ? { ...x, ...p } : x)) } : c));
    clearErrors(Object.keys(p).map((k) => `pillars.${i}.${k}`));
    setNotice(null);
  };

  const patchDiscipline = (i: number, p: Partial<DisciplineDraft>) => {
    setDisciplines((list) => list.map((x, j) => (j === i ? { ...x, ...p } : x)));
    clearErrors(Object.keys(p).map((k) => `items.${i}.${k}`));
    setNotice(null);
  };

  const trackUpload = (busy: boolean) => setUploads((n) => Math.max(0, n + (busy ? 1 : -1)));

  // Which tab holds the first error, so a failed save shows it.
  const tabOfError = useMemo<Tab | null>(() => {
    const keys = Object.keys(errors);
    if (!keys.length) return null;
    if (keys.some((k) => k.startsWith('items.'))) return 'disciplines';
    if (keys.some((k) => k.startsWith('about') || k.startsWith('pillars'))) return 'about';
    return 'home';
  }, [errors]);

  useEffect(() => {
    if (tabOfError) setTab(tabOfError);
  }, [tabOfError]);

  const save = async () => {
    if (!content || !saved) return;
    setSaving(true);
    setFormError(null);
    setErrors({});
    try {
      let nextContent = saved.content;
      let nextDisc = saved.disciplines;
      if (contentDirty) {
        nextContent = await adminFetch<SiteContent>('/api/admin/site-content', { method: 'PUT', json: content });
        setSaved((s) => (s ? { ...s, content: nextContent } : s));
      }
      if (disciplinesDirty) {
        const rows = await adminFetch<DisciplineRecord[]>('/api/admin/disciplines', {
          method: 'PUT',
          json: { items: disciplines.map((d) => ({ ...d, tagline: d.tagline || null })) },
        });
        nextDisc = toDrafts(rows);
      }
      setSaved({ content: nextContent, disciplines: nextDisc });
      setContent(nextContent);
      setDisciplines(nextDisc);
      setNotice('Saved. The live site now shows these changes.');
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrors(err.fieldErrors);
        setFormError('Some fields need attention before this can be saved.');
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Could not save. Your edits are still here.');
      }
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!saved) return;
    setContent(saved.content);
    setDisciplines(saved.disciplines);
    setErrors({});
    setFormError(null);
  };

  if (state === 'loading') return <ListSkeleton rows={5} />;
  if (state === 'error' || !content) return <LoadFailed what="the site content" onRetry={load} />;

  const e = errors;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site content"
        description="Words and images on the public homepage and About page."
        action={
          <a
            href={tab === 'about' ? '/about' : '/'}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-skyblue"
          >
            Open live page <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        }
      />

      <div role="tablist" aria-label="Content sections" className="inline-flex flex-wrap p-1 rounded-full border border-white/10 bg-white/[0.03]">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cx(
              'px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer',
              tab === t.id ? 'bg-white text-black font-medium' : 'text-white/60 hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className={notice ? 'text-sm text-white/70 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2' : 'sr-only'}>
        {notice}
      </div>
      <FormBanner message={formError} />

      {tab === 'home' && (
        <div role="tabpanel" id="panel-home" aria-labelledby="tab-home" className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          <Card className="p-5 sm:p-6 space-y-8">
            <FormSection title="Hero" description="The first thing visitors read.">
              <TextField label="Eyebrow" maxLength={80} value={content.heroEyebrow} onChange={(v) => patch({ heroEyebrow: v })} error={e.heroEyebrow} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Headline" required maxLength={80} value={content.heroTitle} onChange={(v) => patch({ heroTitle: v })} error={e.heroTitle} />
                <TextField
                  label="Headline, second line (muted)"
                  maxLength={80}
                  value={content.heroTitleMuted}
                  onChange={(v) => patch({ heroTitleMuted: v })}
                  error={e.heroTitleMuted}
                />
              </div>
              <TextArea label="Intro" required maxLength={600} rows={4} value={content.heroBody} onChange={(v) => patch({ heroBody: v })} error={e.heroBody} />
            </FormSection>
            <FormSection title="Studio quote">
              <TextArea
                label="Quote"
                required
                maxLength={400}
                rows={3}
                value={content.manifestoQuote}
                onChange={(v) => patch({ manifestoQuote: v })}
                error={e.manifestoQuote}
              />
              <TextField
                label="Attribution"
                maxLength={120}
                value={content.manifestoAttribution}
                onChange={(v) => patch({ manifestoAttribution: v })}
                error={e.manifestoAttribution}
              />
            </FormSection>
            <FormSection title="Team section" description="Heading above the team on the homepage. Manage the people under Team.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Eyebrow" maxLength={60} value={content.teamEyebrow} onChange={(v) => patch({ teamEyebrow: v })} error={e.teamEyebrow} />
                <TextField label="Title" required maxLength={80} value={content.teamTitle} onChange={(v) => patch({ teamTitle: v })} error={e.teamTitle} />
              </div>
              <TextArea label="Intro" maxLength={400} rows={3} value={content.teamIntro} onChange={(v) => patch({ teamIntro: v })} error={e.teamIntro} />
            </FormSection>
          </Card>
          <div className="xl:sticky xl:top-24 self-start space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Preview</div>
            <HeroPreview c={content} />
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div role="tabpanel" id="panel-about" aria-labelledby="tab-about" className="space-y-6">
          <Card className="p-5 sm:p-6">
            <FormSection title="About page opening">
              <TextField label="Eyebrow" maxLength={80} value={content.aboutEyebrow} onChange={(v) => patch({ aboutEyebrow: v })} error={e.aboutEyebrow} />
              <TextField label="Headline" required maxLength={120} value={content.aboutTitle} onChange={(v) => patch({ aboutTitle: v })} error={e.aboutTitle} />
              <TextArea label="Intro" required maxLength={800} rows={4} value={content.aboutBody} onChange={(v) => patch({ aboutBody: v })} error={e.aboutBody} />
            </FormSection>
          </Card>

          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-skyblue">Design pillars ({content.pillars.length}/8)</h3>
                <p className="text-xs text-white/45 mt-1">The &ldquo;What sets us apart&rdquo; cards on the About page.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={content.pillars.length >= 8}
                onClick={() => patch({ pillars: [...content.pillars, { title: '', desc: '', img: '' }] })}
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Add pillar
              </Button>
            </div>
            {e.pillars && <p className="text-xs text-red-300">{e.pillars}</p>}
            <ol className="space-y-4">
              {content.pillars.map((p, i) => (
                <li key={i} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] text-white/45">Pillar {i + 1}</span>
                    <div className="flex items-center">
                      <IconButton label={`Move pillar ${i + 1} up`} disabled={i === 0} onClick={() => patch({ pillars: move(content.pillars, i, i - 1) })}>
                        <ArrowUp className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        label={`Move pillar ${i + 1} down`}
                        disabled={i === content.pillars.length - 1}
                        onClick={() => patch({ pillars: move(content.pillars, i, i + 1) })}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        label={`Remove pillar ${i + 1}`}
                        tone="danger"
                        disabled={content.pillars.length <= 1}
                        onClick={() => patch({ pillars: content.pillars.filter((_, j) => j !== i) })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                    <ImageUpload
                      label="Image"
                      required
                      value={p.img}
                      onChange={(url) => patchPillar(i, { img: url })}
                      onBusyChange={trackUpload}
                      error={e[`pillars.${i}.img`]}
                    />
                    <div className="space-y-4">
                      <TextField label="Title" required maxLength={80} value={p.title} onChange={(v) => patchPillar(i, { title: v })} error={e[`pillars.${i}.title`]} />
                      <TextArea
                        label="Description"
                        required
                        maxLength={400}
                        rows={3}
                        value={p.desc}
                        onChange={(v) => patchPillar(i, { desc: v })}
                        error={e[`pillars.${i}.desc`]}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      {tab === 'disciplines' && (
        <div role="tabpanel" id="panel-disciplines" aria-labelledby="tab-disciplines">
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-skyblue">Disciplines ({disciplines.length})</h3>
                <p className="text-xs text-white/45 mt-1">Services shown on the homepage and About page, in this order.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={disciplines.length >= 24}
                onClick={() => setDisciplines((l) => [...l, { title: '', tagline: '', description: '', image_url: '' }])}
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Add discipline
              </Button>
            </div>
            <ol className="space-y-4">
              {disciplines.map((d, i) => (
                <li key={d.id ?? `new-${i}`} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <span className="text-sm text-white truncate">{d.title || <span className="text-white/40">Untitled discipline</span>}</span>
                    <div className="flex items-center shrink-0">
                      <IconButton label={`Move ${d.title || 'discipline'} up`} disabled={i === 0} onClick={() => setDisciplines((l) => move(l, i, i - 1))}>
                        <ArrowUp className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        label={`Move ${d.title || 'discipline'} down`}
                        disabled={i === disciplines.length - 1}
                        onClick={() => setDisciplines((l) => move(l, i, i + 1))}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </IconButton>
                      <IconButton label={`Remove ${d.title || 'discipline'}`} tone="danger" onClick={() => setDisciplines((l) => l.filter((_, j) => j !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                    <ImageUpload
                      label="Image"
                      required
                      value={d.image_url}
                      onChange={(url) => patchDiscipline(i, { image_url: url })}
                      onBusyChange={trackUpload}
                      error={e[`items.${i}.image_url`]}
                    />
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField label="Title" required maxLength={120} value={d.title} onChange={(v) => patchDiscipline(i, { title: v })} error={e[`items.${i}.title`]} />
                        <TextField label="Tagline" maxLength={200} value={d.tagline} onChange={(v) => patchDiscipline(i, { tagline: v })} error={e[`items.${i}.tagline`]} />
                      </div>
                      <TextArea
                        label="Description"
                        required
                        maxLength={1200}
                        rows={3}
                        value={d.description}
                        onChange={(v) => patchDiscipline(i, { description: v })}
                        error={e[`items.${i}.description`]}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      <SaveBar dirty={dirty} saving={saving} busy={uploads > 0} problems={Object.keys(errors).length} onSave={save} onDiscard={discard} />
      {guard}
    </div>
  );
}
