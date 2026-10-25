'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import { adminFetch, ApiError } from '@/components/admin/adminFetch';
import { Button, Card, IconButton, PageHeader, StatusChip, cx } from '@/components/admin/ui';
import { FormBanner, ListSkeleton, LoadFailed } from '@/components/admin/AdminStates';
import SaveBar from '@/components/admin/SaveBar';
import { useUnsavedGuard } from '@/components/admin/useUnsavedGuard';
import {
  ABOUT_SECTIONS,
  DEFAULT_PAGE_LAYOUT,
  HOME_SECTIONS,
  type LayoutEntry,
  type PageLayout,
  type SectionInfo,
} from '@/lib/content/layout';

type Page = 'home' | 'about';

const PAGES: { id: Page; label: string; href: string; sections: readonly SectionInfo[] }[] = [
  { id: 'home', label: 'Home page', href: '/', sections: HOME_SECTIONS },
  { id: 'about', label: 'About page', href: '/about', sections: ABOUT_SECTIONS },
];

function Row({
  entry,
  info,
  index,
  total,
  canHide,
  onMove,
  onToggle,
}: {
  entry: LayoutEntry;
  info: SectionInfo;
  index: number;
  total: number;
  canHide: boolean;
  onMove: (from: number, to: number) => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        'rounded-md border bg-black/20 p-3 sm:p-4 flex items-start gap-3',
        isDragging ? 'border-skyblue/60 shadow-2xl relative z-10' : 'border-white/10',
        !entry.visible && 'opacity-60'
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag ${info.label} to reorder`}
        className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-1 text-white/45 hover:text-white active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="mt-0.5 w-6 shrink-0 font-mono text-xs text-white/50">{String(index + 1).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-white">{info.label}</span>
          {!entry.visible && <StatusChip>Hidden</StatusChip>}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-white/60">{info.description}</p>
        <Link href={info.editHref} className="mt-1.5 inline-block text-xs text-skyblue hover:underline">
          {info.editHint}
        </Link>
      </div>
      <div className="flex shrink-0 items-center">
        <IconButton label={`Move ${info.label} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
          <ArrowUp className="h-4 w-4" />
        </IconButton>
        <IconButton label={`Move ${info.label} down`} disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>
          <ArrowDown className="h-4 w-4" />
        </IconButton>
        <IconButton
          label={entry.visible ? `Hide ${info.label}` : `Show ${info.label}`}
          disabled={entry.visible && !canHide}
          title={entry.visible && !canHide ? 'A page needs at least one visible section' : undefined}
          onClick={onToggle}
        >
          {entry.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </IconButton>
      </div>
    </li>
  );
}

export default function AdminPageLayoutPage() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saved, setSaved] = useState<PageLayout | null>(null);
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const l = await adminFetch<PageLayout>('/api/admin/layout');
      setSaved(l);
      setLayout(l);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!saved && !!layout && JSON.stringify(layout) !== JSON.stringify(saved);
  const { guard } = useUnsavedGuard(dirty);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const current = PAGES.find((p) => p.id === page)!;
  const entries = (layout?.[page] ?? []) as LayoutEntry[];
  const infoById = useMemo(() => new Map(current.sections.map((s) => [s.id as string, s])), [current]);
  const visibleCount = entries.filter((e) => e.visible).length;

  const setEntries = (next: LayoutEntry[]) => {
    setLayout((l) => (l ? ({ ...l, [page]: next } as PageLayout) : l));
    setNotice(null);
    setFormError(null);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= entries.length) return;
    setEntries(arrayMove(entries, from, to));
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = entries.findIndex((x) => x.id === e.active.id);
    const to = entries.findIndex((x) => x.id === e.over!.id);
    if (from >= 0 && to >= 0) setEntries(arrayMove(entries, from, to));
  };

  const toggle = (id: string) => setEntries(entries.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)));

  const reset = () => setEntries(DEFAULT_PAGE_LAYOUT[page] as LayoutEntry[]);

  const save = async () => {
    if (!layout) return;
    setSaving(true);
    setFormError(null);
    try {
      const next = await adminFetch<PageLayout>('/api/admin/layout', { method: 'PUT', json: layout });
      setSaved(next);
      setLayout(next);
      setNotice('Saved. The live site now shows this order.');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save. Your changes are still here.');
    } finally {
      setSaving(false);
    }
  };

  if (state === 'loading') return <ListSkeleton rows={6} />;
  if (state === 'error' || !layout) return <LoadFailed what="the page layout" onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page layout"
        description="Choose which sections each page shows and in what order. Drag the handle (or use the arrows), hide what you don't need, then Save."
        action={
          <a href={current.href} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-skyblue">
            Open live page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        }
      />

      <div role="tablist" aria-label="Pages" className="inline-flex flex-wrap rounded-full border border-white/10 bg-white/[0.03] p-1">
        {PAGES.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={page === p.id}
            onClick={() => setPage(p.id)}
            className={cx(
              'cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors',
              page === p.id ? 'bg-white font-medium text-black' : 'text-white/60 hover:text-white'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className={notice ? 'rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70' : 'sr-only'}>
        {notice}
      </div>
      <FormBanner message={formError} />

      <Card className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-white/60">
            {visibleCount} of {entries.length} sections shown, top to bottom.
          </p>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset this page
          </Button>
        </div>

        <DndContext id="page-layout-sections" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2.5">
              {entries.map((e, i) => (
                <Row
                  key={e.id}
                  entry={e}
                  info={infoById.get(e.id)!}
                  index={i}
                  total={entries.length}
                  canHide={visibleCount > 1}
                  onMove={move}
                  onToggle={() => toggle(e.id)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => saved && setLayout(saved)} />
      {guard}
    </div>
  );
}
