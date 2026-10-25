'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { ProjectBackgroundMode, ProjectBlockRecord, ProjectRecord, ProjectStatusState } from '@/lib/db/types';
import { adminFetch, ApiError } from './adminFetch';
import { Button, Card, CardHeader, ConfirmDialog, IconButton, StatusChip, cx } from './ui';
import { TextArea, TextField, Toggle } from './Field';
import ImageUpload from './ImageUpload';
import ModelPicker, { type PickerModel } from './ModelPicker';
import { FormBanner } from './AdminStates';
import { useUnsavedGuard } from './useUnsavedGuard';
import { BLOCK_META, BlockFields, metaFor, newBlockContent, summarizeBlock, validateBlock, type BlockContent, type BlockPatch } from './projectBlocks';

/**
 * Add or edit a project — one page, one Save.
 *
 * Laid out like the studio's other form builders: a sticky bar (back, title, saved status,
 * preview, save), then cards for each part, repeatable story sections you can reorder, and
 * a dashed "add" button. Everything saves together, in one transaction, so a project is never
 * left half-written. Ctrl/Cmd + S saves.
 */

interface Props {
  /** Null = creating a new project. */
  initialProject: ProjectRecord | null;
  initialBlocks: ProjectBlockRecord[];
  models: PickerModel[];
  typologies: string[];
}

interface Extra {
  k: string;
  key: string;
  value: string;
}

interface Draft {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  summary: string;
  status_state: ProjectStatusState;
  is_featured: boolean;
  hero_image_url: string;
  thumbnail_url: string;
  theme_bg_color: string;
  model_id: string | null;
  bg_mode: ProjectBackgroundMode;
  bg_image_url: string;
  bg_dim: number;
  client: string;
  location: string;
  year: string;
  size: string;
  status: string;
  typology: string;
  extras: Extra[];
}

interface BlockDraft {
  k: string;
  id?: string;
  type: string;
  hidden: boolean;
  open: boolean;
  content: BlockContent;
}

const key = () => Math.random().toString(36).slice(2, 10);

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toDraft(p: ProjectRecord | null): Draft {
  let extras: Extra[] = [];
  try {
    const meta = JSON.parse(p?.custom_metadata_json || '{}') as Record<string, string>;
    extras = Object.entries(meta).map(([k, v]) => ({ k: key(), key: k, value: String(v) }));
  } catch {
    extras = [];
  }
  return {
    id: p?.id,
    title: p?.title ?? '',
    slug: p?.slug ?? '',
    subtitle: p?.subtitle ?? '',
    summary: p?.summary ?? '',
    status_state: p?.status_state ?? 'draft',
    is_featured: p?.is_featured === 1,
    hero_image_url: p?.hero_image_url ?? '',
    thumbnail_url: p?.thumbnail_url ?? '',
    theme_bg_color: p && /^#[0-9a-f]{6}$/i.test(p.theme_bg_color ?? '') ? p.theme_bg_color : '#0a0a0c',
    model_id: p?.model_id ?? null,
    bg_mode: p?.bg_mode ?? 'auto',
    bg_image_url: p?.bg_image_url ?? '',
    bg_dim: p?.bg_dim ?? 50,
    client: p?.client ?? '',
    location: p?.location ?? '',
    year: p ? (p.year ?? '') : String(new Date().getFullYear()),
    size: p?.size ?? '',
    status: p?.status ?? '',
    typology: p?.typology ?? '',
    extras,
  };
}

function toBlockDrafts(blocks: ProjectBlockRecord[], open: (index: number) => boolean = () => false): BlockDraft[] {
  return blocks.map((b, i) => {
    let content: BlockContent = {};
    try {
      content = typeof b.content_json === 'string' ? JSON.parse(b.content_json) : (b.content_json as BlockContent);
    } catch {
      content = {};
    }
    return { k: key(), id: b.id, type: b.block_type, hidden: b.is_hidden === 1, open: open(i), content };
  });
}

const snapshot = (d: Draft, blocks: BlockDraft[]) =>
  JSON.stringify({
    d: { ...d, extras: d.extras.map(({ key: k, value }) => [k, value]) },
    b: blocks.map((b) => [b.id ?? '', b.type, b.hidden, b.content]),
  });

const STATES: { value: ProjectStatusState; label: string; hint: string }[] = [
  { value: 'published', label: 'Published', hint: 'Visible on the website.' },
  { value: 'draft', label: 'Draft', hint: 'Hidden. Only you can open it.' },
  { value: 'archived', label: 'Archived', hint: 'Hidden and kept for later.' },
];

const BG_MODES: { id: ProjectBackgroundMode; label: string; hint: string }[] = [
  { id: 'auto', label: 'Automatic', hint: 'The 3D model if you chose one below; otherwise the picture.' },
  { id: 'picture', label: 'Picture only', hint: 'Always the picture. The 3D model is not used on this project.' },
  { id: 'color', label: 'Plain colour', hint: 'Just the page colour: no picture, no 3D.' },
];

const SECTIONS = [
  { id: 'basics', label: 'Basics' },
  { id: 'cover', label: 'Cover' },
  { id: 'background', label: 'Background' },
  { id: '3d', label: '3D model' },
  { id: 'facts', label: 'Facts' },
  { id: 'story', label: 'Story' },
];

const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function ProjectEditor({ initialProject, initialBlocks, models: initialModels, typologies }: Props) {
  const router = useRouter();
  const isNew = !initialProject;

  const [draft, setDraft] = useState<Draft>(() => toDraft(initialProject));
  const [blocks, setBlocks] = useState<BlockDraft[]>(() => toBlockDrafts(initialBlocks));
  const [models, setModels] = useState<PickerModel[]>(initialModels);
  const [baseline, setBaseline] = useState<string | null>(() => (initialProject ? snapshot(toDraft(initialProject), toBlockDrafts(initialBlocks)) : null));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [showIssues, setShowIssues] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [deleteBlockKey, setDeleteBlockKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const current = useMemo(() => snapshot(draft, blocks), [draft, blocks]);
  const dirty = baseline === null ? draft.title !== '' || blocks.length > 0 : current !== baseline;
  const { guard } = useUnsavedGuard(dirty);
  const trackUpload = useCallback((busy: boolean) => setUploads((n) => Math.max(0, n + (busy ? 1 : -1))), []);

  const patch = (p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setServerErrors((prev) => {
      const keys = Object.keys(p).map((k) => `project.${k}`);
      if (!keys.some((k) => k in prev)) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
    setFormError(null);
    setSavedAt(null);
  };

  // ---- validation -------------------------------------------------------------------------
  const problems = useMemo(() => {
    const list: { id: string; where: string; message: string }[] = [];
    if (!draft.title.trim()) list.push({ id: 'basics', where: 'Basics', message: 'Give the project a title.' });
    if (!draft.slug.trim()) list.push({ id: 'basics', where: 'Basics', message: 'Add a web address.' });
    else if (!SLUG_OK.test(draft.slug)) list.push({ id: 'basics', where: 'Basics', message: 'The web address can only use lowercase letters, numbers and single dashes.' });
    if (draft.extras.some((e) => !e.key.trim() && e.value.trim())) list.push({ id: 'facts', where: 'Facts', message: 'Give every extra fact a name (or clear its value).' });
    blocks.forEach((b, i) => {
      validateBlock(b.type, b.content).forEach((m) => list.push({ id: `block-${b.k}`, where: `Section ${i + 1} (${metaFor(b.type).label})`, message: m }));
    });
    return list;
  }, [draft.title, draft.slug, draft.extras, blocks]);

  const serverBlockError = (i: number) => {
    const hit = Object.entries(serverErrors).find(([k]) => k.startsWith(`blocks.${i}.`));
    return hit ? hit[1] : null;
  };

  const jumpTo = (id: string) => {
    setBlocks((list) => list.map((b) => (`block-${b.k}` === id ? { ...b, open: true } : b)));
    requestAnimationFrame(() =>
      document.getElementById(id.startsWith('block-') ? id : `section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
  };

  // ---- save -------------------------------------------------------------------------------
  const save = useCallback(async () => {
    if (saving || uploads > 0) return;
    if (problems.length > 0) {
      setShowIssues(true);
      setFormError(null);
      requestAnimationFrame(() => {
        const bad = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (bad) bad.focus();
        else jumpTo(problems[0].id);
      });
      return;
    }

    setSaving(true);
    setServerErrors({});
    setFormError(null);
    try {
      const metadata: Record<string, string> = {};
      draft.extras.forEach((e) => {
        if (e.key.trim()) metadata[e.key.trim()] = e.value.trim();
      });
      const result = await adminFetch<{ project: ProjectRecord; blocks: ProjectBlockRecord[] }>('/api/admin/projects/save', {
        method: 'POST',
        json: {
          project: {
            id: draft.id,
            slug: draft.slug.trim(),
            title: draft.title.trim(),
            subtitle: draft.subtitle,
            summary: draft.summary,
            client: draft.client,
            location: draft.location,
            year: draft.year,
            size: draft.size,
            status: draft.status,
            typology: draft.typology,
            hero_image_url: draft.hero_image_url,
            thumbnail_url: draft.thumbnail_url,
            theme_bg_color: draft.theme_bg_color,
            is_featured: draft.is_featured ? 1 : 0,
            status_state: draft.status_state,
            model_id: draft.model_id,
            bg_mode: draft.bg_mode,
            bg_image_url: draft.bg_image_url,
            bg_dim: draft.bg_dim,
            custom_metadata: metadata,
            description: initialProject?.description ?? '',
          },
          blocks: blocks.map((b) => ({ id: b.id, block_type: b.type, is_hidden: b.hidden ? 1 : 0, content: b.content })),
        },
      });

      const openIdx = new Set(blocks.flatMap((b, i) => (b.open ? [i] : [])));
      const nextDraft = toDraft(result.project);
      const nextBlocks = toBlockDrafts(result.blocks, (i) => openIdx.has(i));
      setDraft(nextDraft);
      setBlocks(nextBlocks);
      setBaseline(snapshot(nextDraft, nextBlocks));
      setShowIssues(false);
      setSavedAt(Date.now());
      if (isNew) router.replace(`/admin/projects/${result.project.id}`);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setServerErrors(err.fieldErrors);
        setShowIssues(true);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'Saving failed. Please try again.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, uploads, problems, draft, blocks, initialProject, isNew, router]);

  // Ctrl/Cmd + S
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- section (block) actions ------------------------------------------------------------
  const addBlock = (type: string) => {
    const b: BlockDraft = { k: key(), type, hidden: false, open: true, content: newBlockContent(type) };
    setBlocks((list) => [...list, b]);
    setPicking(false);
    setSavedAt(null);
    requestAnimationFrame(() => document.getElementById(`block-${b.k}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };
  const patchBlock = (k: string, p: BlockPatch) => {
    setBlocks((list) => list.map((b) => (b.k === k ? { ...b, content: { ...b.content, ...(typeof p === 'function' ? p(b.content) : p) } } : b)));
    setServerErrors({});
    setSavedAt(null);
  };
  const updateBlock = (k: string, p: Partial<BlockDraft>) => {
    setBlocks((list) => list.map((b) => (b.k === k ? { ...b, ...p } : b)));
    setSavedAt(null);
  };
  const moveBlock = (i: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    setBlocks((list) => {
      const next = [...list];
      const [item] = next.splice(i, 1);
      next.splice(to, 0, item);
      return next;
    });
    setSavedAt(null);
  };
  const duplicateBlock = (i: number) => {
    setBlocks((list) => {
      const src = list[i];
      const copy: BlockDraft = { ...src, k: key(), id: undefined, open: true, content: JSON.parse(JSON.stringify(src.content)) };
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
    });
    setSavedAt(null);
  };

  const deleteProject = async () => {
    if (!draft.id) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/projects/${draft.id}`, { method: 'DELETE' });
      setBaseline(current); // nothing left to protect
      router.push('/admin/projects');
    } catch (err) {
      setConfirmDelete(false);
      setFormError(err instanceof Error ? err.message : 'Could not delete the project.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setDeleting(false);
    }
  };

  const titleError = (showIssues && !draft.title.trim() && 'Give the project a title.') || serverErrors['project.title'];
  const slugError =
    (showIssues && !draft.slug.trim() && 'Add a web address.') ||
    (showIssues && draft.slug && !SLUG_OK.test(draft.slug) && 'Use lowercase letters, numbers and single dashes.') ||
    serverErrors['project.slug'];

  const allOpen = blocks.length > 0 && blocks.every((b) => b.open);
  const statusText = dirty ? (
    <>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-skyblue" />
      <span className="text-white">{baseline === null ? 'Not saved yet' : 'Unsaved changes'}</span>
      {showIssues && problems.length > 0 && <span className="text-red-300">· {problems.length} to fix</span>}
    </>
  ) : (
    <>
      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
      <span className="text-white/60">{savedAt ? 'Saved' : 'All changes saved'}</span>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-28">
      {guard}

      {/* Sticky bar */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-white/10 bg-[#0b0b0e]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-2">
          <IconButton label="Back to projects" onClick={() => router.push('/admin/projects')} className="border border-white/10">
            <ArrowLeft className="h-4 w-4" />
          </IconButton>
          <div className="min-w-0 flex-1 basis-40">
            <h1 className="truncate font-display text-lg font-bold text-white sm:text-xl">{draft.title.trim() || (isNew ? 'New project' : 'Untitled project')}</h1>
            <p className="flex items-center gap-1.5 text-xs" role="status" aria-live="polite">
              {statusText}
            </p>
          </div>
          {!isNew && draft.slug && (
            <Link
              href={`/projects/${draft.slug}`}
              target="_blank"
              rel="noopener"
              title={dirty ? 'The preview shows the last saved version' : 'Open the page as visitors see it'}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Preview</span>
              <span className="sr-only sm:hidden">Preview (opens in a new tab)</span>
            </Link>
          )}
          <Button onClick={save} loading={saving} disabled={uploads > 0 || (!dirty && !isNew)} aria-keyshortcuts="Control+S Meta+S">
            {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
            {saving ? 'Saving…' : uploads > 0 ? 'Uploading…' : isNew ? 'Create project' : 'Save'}
          </Button>
        </div>
        <nav aria-label="Jump to a section" className="mx-auto mt-3 flex max-w-4xl gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-white/65 transition-colors hover:border-skyblue/50 hover:text-white"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <FormBanner message={formError} />

      <fieldset disabled={saving} className="m-0 min-w-0 space-y-6 border-0 p-0">
      {showIssues && problems.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-400/30 bg-red-500/[0.07] px-4 py-3 text-sm text-red-100">
          <p className="font-semibold">
            {problems.length} {problems.length === 1 ? 'thing needs' : 'things need'} fixing before this can be saved:
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5">
            {problems.map((p, i) => (
              <li key={i}>
                <button type="button" className="cursor-pointer underline underline-offset-2" onClick={() => jumpTo(p.id)}>
                  {p.where}
                </button>
                : {p.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Basics */}
      <Card id="section-basics" className="scroll-mt-44">
        <CardHeader title="Basics" description="The name, the web address and whether the project is on the website." />
        <div className="space-y-5 p-5">
          <TextField
            label="Project title"
            required
            value={draft.title}
            error={titleError || undefined}
            maxLength={120}
            autoFocus={isNew}
            placeholder="For example: Al-Zareef Hotel"
            onChange={(v) => patch({ title: v, ...(!slugTouched ? { slug: slugify(v) } : {}) })}
          />
          <TextField
            label="Web address"
            required
            value={draft.slug}
            error={slugError || undefined}
            maxLength={80}
            hint={`This project will live at /projects/${draft.slug || 'your-address'}${!isNew ? ' — changing it breaks old links.' : ''}`}
            onChange={(v) => {
              setSlugTouched(true);
              patch({ slug: v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-/, '') });
            }}
          />
          <TextField label="Subtitle" hint="One line shown under the title on the project page." value={draft.subtitle} maxLength={300} onChange={(v) => patch({ subtitle: v })} />
          <TextArea label="Short summary" hint="Shown on the project cards and in search results." rows={3} value={draft.summary} maxLength={800} onChange={(v) => patch({ summary: v })} />

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-white/80">Visibility</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {STATES.map((s) => (
                <label
                  key={s.value}
                  className={cx(
                    'flex cursor-pointer flex-col gap-0.5 rounded-md border px-3.5 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-skyblue',
                    draft.status_state === s.value ? 'border-skyblue/50 bg-skyblue/[0.08]' : 'border-white/10 bg-black/20 hover:border-white/25'
                  )}
                >
                  <input type="radio" name="status_state" value={s.value} checked={draft.status_state === s.value} onChange={() => patch({ status_state: s.value })} className="sr-only" />
                  <span className="text-sm font-medium text-white">{s.label}</span>
                  <span className="text-xs text-white/55">{s.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Toggle label="Feature on the homepage" description="Featured projects appear first on the homepage." checked={draft.is_featured} onChange={(v) => patch({ is_featured: v })} />
        </div>
      </Card>

      {/* 2. Cover */}
      <Card id="section-cover" className="scroll-mt-44">
        <CardHeader title="Cover" description="The pictures that represent this project." />
        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <ImageUpload
            label="Cover image"
            hint="The big picture at the top of the project page (and the background if there is no 3D model)."
            value={draft.hero_image_url}
            onChange={(url) => patch({ hero_image_url: url })}
            onBusyChange={trackUpload}
            aspect="aspect-[16/9]"
          />
          <ImageUpload
            label="Card picture"
            hint="The picture on the project cards and the homepage. Falls back to the cover image."
            value={draft.thumbnail_url}
            onChange={(url) => patch({ thumbnail_url: url })}
            onBusyChange={trackUpload}
            aspect="aspect-[16/9]"
          />
        </div>
      </Card>

      {/* 2b. Background */}
      <Card id="section-background" className="scroll-mt-44">
        <CardHeader title="Background" description="What fills the page behind this project's title and story." />
        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-white/80">What to show</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {BG_MODES.map((m) => (
                  <label
                    key={m.id}
                    className={cx(
                      'flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2.5 transition-colors',
                      draft.bg_mode === m.id ? 'border-skyblue/60 bg-skyblue/10' : 'border-white/10 bg-black/20 hover:border-white/25'
                    )}
                  >
                    <input type="radio" name="bg-mode" className="sr-only" checked={draft.bg_mode === m.id} onChange={() => patch({ bg_mode: m.id })} />
                    <span className="text-sm font-medium text-white">{m.label}</span>
                    <span className="text-xs text-white/55">{m.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {draft.bg_mode !== 'color' && (
              <>
                <ImageUpload
                  label="Background picture"
                  hint="Its own picture behind the page. Leave empty to use the cover image (or the studio's default background from Site content)."
                  value={draft.bg_image_url}
                  onChange={(url) => patch({ bg_image_url: url })}
                  onBusyChange={trackUpload}
                  aspect="aspect-[16/9]"
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bg-dim" className="flex items-center justify-between text-xs font-medium text-white/80">
                    <span>Darkness of the picture</span>
                    <span className="tabular-nums text-white/60">{draft.bg_dim}%</span>
                  </label>
                  <input
                    id="bg-dim"
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={draft.bg_dim}
                    onChange={(e) => patch({ bg_dim: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-[#4cb8f5]"
                  />
                  <p className="text-xs text-white/55">Darker keeps the white page text easy to read. The studio&apos;s default is 50%.</p>
                </div>
              </>
            )}

            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="theme-colour" className="text-xs font-medium text-white/80">
                  Page background colour
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="theme-colour"
                    type="color"
                    value={draft.theme_bg_color}
                    onChange={(e) => patch({ theme_bg_color: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-md border border-white/10 bg-transparent p-1"
                  />
                  <code className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">{draft.theme_bg_color}</code>
                </div>
              </div>
              <p className="max-w-md pb-1 text-xs text-white/60">Keep it dark — the page text is white. The studio&apos;s default is #0a0a0c.</p>
            </div>
          </div>

          {/* Live preview of what visitors will see behind the title */}
          <div>
            <div className="mb-2 text-xs font-medium text-white/80">Preview</div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-white/10" style={{ background: draft.theme_bg_color }}>
              {draft.bg_mode !== 'color' && (draft.bg_image_url || draft.hero_image_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.bg_image_url || draft.hero_image_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: 1 - draft.bg_dim / 100 }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="font-display text-xl leading-tight text-white">{draft.title || 'Project title'}</div>
                <div className="text-[11px] uppercase tracking-widest text-skyblue">{draft.bg_mode === 'color' ? 'Plain colour' : draft.bg_mode === 'picture' ? 'Picture only' : draft.model_id ? '3D model, picture while loading' : 'Picture'}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. 3D model */}
      <Card id="section-3d" className="scroll-mt-44">
        <CardHeader title="3D model" description="Shown as the interactive background of this project's page. It is downloaded only when someone opens the project." />
        <div className="p-5">
          <ModelPicker
            models={models}
            value={draft.model_id}
            error={serverErrors['project.model_id']}
            onChange={(id) => patch({ model_id: id })}
            onModelAdded={(m) => setModels((list) => [...list.filter((x) => x.id !== m.id), m].sort((a, b) => a.label.localeCompare(b.label)))}
            onBusyChange={trackUpload}
          />
        </div>
      </Card>

      {/* 4. Facts */}
      <Card id="section-facts" className="scroll-mt-44">
        <CardHeader title="Project facts" description="The details shown in the facts bar of the project page." />
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Client" value={draft.client} maxLength={120} placeholder="Private client" onChange={(v) => patch({ client: v })} />
            <TextField label="Location" value={draft.location} maxLength={120} placeholder="Iraq - Baghdad" onChange={(v) => patch({ location: v })} />
            <TextField label="Year" value={draft.year} maxLength={20} placeholder="2026" onChange={(v) => patch({ year: v })} />
            <TextField label="Scale / area" value={draft.size} maxLength={120} placeholder="12,000 m²" onChange={(v) => patch({ size: v })} />
            <TextField label="Phase" value={draft.status} maxLength={120} placeholder="In design" onChange={(v) => patch({ status: v })} />
            <div className="flex flex-col gap-1.5">
              <TextField label="Type" value={draft.typology} maxLength={120} placeholder="Residential" list="typology-options" onChange={(v) => patch({ typology: v })} />
              <datalist id="typology-options">
                {typologies.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5">
            <div>
              <h3 className="text-sm font-medium text-white">Extra facts</h3>
              <p className="text-xs text-white/50">Anything else worth showing, for example &ldquo;Floors — 12&rdquo;.</p>
            </div>
            {draft.extras.map((e) => (
              <div key={e.k} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <TextField label="Name" value={e.key} maxLength={80} onChange={(v) => patch({ extras: draft.extras.map((x) => (x.k === e.k ? { ...x, key: v } : x)) })} />
                <TextField label="Value" value={e.value} maxLength={300} onChange={(v) => patch({ extras: draft.extras.map((x) => (x.k === e.k ? { ...x, value: v } : x)) })} />
                <IconButton label="Remove fact" tone="danger" className="self-end sm:mb-0.5" onClick={() => patch({ extras: draft.extras.filter((x) => x.k !== e.k) })}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            ))}
            <Button variant="secondary" size="sm" disabled={draft.extras.length >= 30} onClick={() => patch({ extras: [...draft.extras, { k: key(), key: '', value: '' }] })}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add a fact
            </Button>
          </div>
        </div>
      </Card>

      {/* 5. Story */}
      <section id="section-story" className="scroll-mt-44 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Story</h2>
            <p className="text-sm text-white/55">
              {blocks.length} {blocks.length === 1 ? 'section' : 'sections'} · shown in this order below the facts.
            </p>
          </div>
          {blocks.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setBlocks((list) => list.map((b) => ({ ...b, open: !allOpen })))}>
              {allOpen ? 'Collapse all' : 'Expand all'}
            </Button>
          )}
        </div>

        {blocks.length === 0 && !picking && (
          <p className="rounded-lg border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/55">
            No story yet. Add text, pictures, galleries and drawings to tell the project&apos;s story.
          </p>
        )}

        <div className="space-y-3">
          {blocks.map((b, i) => {
            const meta = metaFor(b.type);
            const Icon = meta.icon;
            const issues = showIssues ? validateBlock(b.type, b.content) : [];
            const serverMsg = serverBlockError(i);
            const summary = summarizeBlock(b.type, b.content);
            const bad = issues.length > 0 || !!serverMsg;
            return (
              <div
                key={b.k}
                id={`block-${b.k}`}
                className={cx('scroll-mt-44 rounded-lg border bg-[#111116] transition-colors', bad ? 'border-red-400/50' : 'border-white/10', b.hidden && 'opacity-60')}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                  <button
                    type="button"
                    onClick={() => updateBlock(b.k, { open: !b.open })}
                    aria-expanded={b.open}
                    aria-controls={`block-body-${b.k}`}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
                  >
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/30 text-skyblue">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {i + 1}. {meta.label}
                        </span>
                        {b.hidden && <StatusChip tone="neutral">Hidden</StatusChip>}
                        {bad && <StatusChip tone="danger">Needs attention</StatusChip>}
                      </span>
                      <span className="block truncate text-xs text-white/50">{summary || 'Empty — open to fill in'}</span>
                    </span>
                    <ChevronDown aria-hidden="true" className={cx('h-4 w-4 shrink-0 text-white/60 transition-transform', b.open && 'rotate-180')} />
                  </button>
                  <div className="flex shrink-0 items-center">
                    <IconButton label="Move up" disabled={i === 0} onClick={() => moveBlock(i, i - 1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Move down" disabled={i === blocks.length - 1} onClick={() => moveBlock(i, i + 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                    <span className="hidden sm:contents">
                      <IconButton label={b.hidden ? 'Show on the page' : 'Hide from the page'} onClick={() => updateBlock(b.k, { hidden: !b.hidden })}>
                        {b.hidden ? <EyeOff className="h-4 w-4 text-skyblue" /> : <Eye className="h-4 w-4" />}
                      </IconButton>
                      <IconButton label="Duplicate section" onClick={() => duplicateBlock(i)}>
                        <Copy className="h-4 w-4" />
                      </IconButton>
                    </span>
                    <IconButton label="Delete section" tone="danger" onClick={() => setDeleteBlockKey(b.k)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>

                {b.open && (
                  <div id={`block-body-${b.k}`} className="border-t border-white/10 p-4 sm:p-5">
                    {(issues.length > 0 || serverMsg) && (
                      <ul role="alert" className="mb-4 list-inside list-disc rounded-md bg-red-500/[0.08] px-3 py-2 text-sm text-red-200">
                        {issues.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                        {serverMsg && <li>{serverMsg}</li>}
                      </ul>
                    )}
                    <BlockFields type={b.type} content={b.content} onChange={(p) => patchBlock(b.k, p)} onBusyChange={trackUpload} busy={uploads > 0} />
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4 sm:hidden">
                      <Button variant="secondary" size="sm" onClick={() => updateBlock(b.k, { hidden: !b.hidden })}>
                        {b.hidden ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        {b.hidden ? 'Show on the page' : 'Hide from the page'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => duplicateBlock(i)}>
                        <Copy className="h-4 w-4" aria-hidden="true" /> Duplicate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {picking ? (
          <div className="rounded-lg border border-skyblue/30 bg-skyblue/[0.04] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">What would you like to add?</h3>
              <Button variant="ghost" size="sm" onClick={() => setPicking(false)}>
                Cancel
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BLOCK_META.filter((m) => m.offered).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => addBlock(m.type)}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-white/10 bg-[#111116] p-3 text-left transition-colors hover:border-skyblue/60 hover:bg-skyblue/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-skyblue" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-medium text-white">{m.label}</span>
                      <span className="block text-xs text-white/55">{m.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 py-4 text-sm font-medium text-white/60 transition-colors hover:border-skyblue hover:bg-skyblue/[0.05] hover:text-skyblue focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add a section
          </button>
        )}
      </section>

      {/* Danger zone */}
      {!isNew && (
        <Card className="border-red-400/20">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Delete this project</h2>
              <p className="text-xs text-white/55">Removes the project and its story for good. To just hide it, set Visibility to Draft or Archived instead.</p>
            </div>
            <Button variant="secondary" className="border-red-400/30 text-red-200 hover:bg-red-500/10" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete project
            </Button>
          </div>
        </Card>
      )}

      </fieldset>

      {deleteBlockKey && (
        <ConfirmDialog
          title="Delete this section?"
          message="The section and everything in it will be removed from the page when you save."
          confirmLabel="Delete section"
          destructive
          onCancel={() => setDeleteBlockKey(null)}
          onConfirm={() => {
            setBlocks((list) => list.filter((b) => b.k !== deleteBlockKey));
            setDeleteBlockKey(null);
            setSavedAt(null);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${draft.title || 'this project'}”?`}
          message="This permanently removes the project and its story. This cannot be undone."
          confirmLabel="Delete project"
          destructive
          busy={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={deleteProject}
        />
      )}
    </div>
  );
}
