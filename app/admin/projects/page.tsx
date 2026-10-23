'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, ExternalLink, FolderKanban, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import type { ProjectRecord } from '@/lib/db/types';
import { adminFetch } from '@/components/admin/adminFetch';
import { Card, ConfirmDialog, EmptyState, IconButton, PageHeader, StatusChip, cx } from '@/components/admin/ui';
import { ListSkeleton, LoadFailed } from '@/components/admin/AdminStates';

type Filter = 'all' | 'published' | 'draft' | 'archived' | 'featured' | 'no3d';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
  { id: 'featured', label: 'Featured' },
  { id: 'no3d', label: 'No 3D model' },
];

const STATE_TONE = { published: 'success', draft: 'warning', archived: 'neutral' } as const;
const STATE_LABEL = { published: 'Published', draft: 'Draft', archived: 'Archived' } as const;

export default function AdminProjectsListPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [modelLabels, setModelLabels] = useState<Record<string, string>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingDelete, setPendingDelete] = useState<ProjectRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [list, models] = await Promise.all([
        adminFetch<ProjectRecord[]>('/api/admin/projects'),
        adminFetch<{ id: string; label: string }[]>('/api/admin/models'),
      ]);
      setProjects(list);
      setModelLabels(Object.fromEntries(models.map((m) => [m.id, m.label])));
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      published: projects.filter((p) => p.status_state === 'published').length,
      draft: projects.filter((p) => p.status_state === 'draft').length,
      archived: projects.filter((p) => p.status_state === 'archived').length,
      featured: projects.filter((p) => p.is_featured === 1).length,
      no3d: projects.filter((p) => !p.model_id).length,
    }),
    [projects]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && ![p.title, p.location, p.typology, p.client].some((v) => v?.toLowerCase().includes(q))) return false;
      switch (filter) {
        case 'published':
        case 'draft':
        case 'archived':
          return p.status_state === filter;
        case 'featured':
          return p.is_featured === 1;
        case 'no3d':
          return !p.model_id;
        default:
          return true;
      }
    });
  }, [projects, search, filter]);

  const toggleFeatured = async (p: ProjectRecord) => {
    const next = p.is_featured === 1 ? 0 : 1;
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, is_featured: next } : x)));
    try {
      await adminFetch(`/api/admin/projects/${p.id}`, { method: 'PUT', json: { is_featured: next } });
    } catch {
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, is_featured: p.is_featured } : x)));
      setMessage('Could not change the featured setting. Please try again.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/projects/${pendingDelete.id}`, { method: 'DELETE' });
      setProjects((list) => list.filter((p) => p.id !== pendingDelete.id));
      setMessage(`“${pendingDelete.title}” was deleted.`);
    } catch {
      setMessage('Could not delete the project. Please try again.');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Add, edit and organise the work shown on the website."
        action={
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-skyblue px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-skyblue-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New project
          </Link>
        }
      />

      {message && (
        <p role="status" className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/85">
          {message}
          <button type="button" onClick={() => setMessage(null)} className="cursor-pointer text-white/50 hover:text-white">
            Dismiss
          </button>
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cx(
                'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue',
                filter === f.id ? 'border-white bg-white font-semibold text-black' : 'border-white/10 text-white/70 hover:border-white/30 hover:text-white'
              )}
            >
              {f.label} <span className={cx('tabular-nums', filter === f.id ? 'text-black/55' : 'text-white/56')}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/56" />
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search by name, place or client"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-[#111116] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/35 focus:border-skyblue focus:outline-none focus:ring-1 focus:ring-skyblue/40"
          />
        </div>
      </div>

      {state === 'loading' && <ListSkeleton rows={5} />}
      {state === 'error' && <LoadFailed what="the projects" onRetry={load} />}

      {state === 'ready' && (
        <Card>
          {shown.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-5 w-5" />}
              title={projects.length === 0 ? 'No projects yet' : 'No projects match'}
              description={projects.length === 0 ? 'Create your first project to show it on the website.' : 'Try another search or filter.'}
              action={
                projects.length === 0 ? (
                  <Link href="/admin/projects/new" className="inline-flex items-center gap-2 rounded-full bg-skyblue px-5 py-2.5 text-sm font-semibold text-black">
                    <Plus className="h-4 w-4" aria-hidden="true" /> New project
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {shown.map((p) => {
                const thumb = p.thumbnail_url || p.hero_image_url;
                return (
                  <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="flex min-w-0 flex-1 items-center gap-4 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
                      aria-label={`Edit ${p.title}`}
                    >
                      <span className="relative block aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-900 sm:w-24">
                        {thumb && <Image src={thumb} alt="" fill sizes="96px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-medium text-white">{p.title}</span>
                        <span className="block truncate text-sm text-white/55">{[p.typology, p.location, p.year].filter(Boolean).join(' · ') || 'No details yet'}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusChip tone={STATE_TONE[p.status_state]}>{STATE_LABEL[p.status_state]}</StatusChip>
                          {p.model_id ? (
                            <StatusChip tone="accent">
                              <Box className="h-3 w-3" aria-hidden="true" /> {modelLabels[p.model_id] ?? '3D'}
                            </StatusChip>
                          ) : (
                            <StatusChip tone="neutral">No 3D</StatusChip>
                          )}
                        </span>
                      </span>
                    </Link>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <IconButton
                        label={p.is_featured === 1 ? 'Remove from the homepage' : 'Feature on the homepage'}
                        aria-pressed={p.is_featured === 1}
                        onClick={() => toggleFeatured(p)}
                      >
                        <Star className={cx('h-4 w-4', p.is_featured === 1 ? 'fill-skyblue text-skyblue' : '')} />
                      </IconButton>
                      {p.status_state === 'published' && (
                        <Link
                          href={`/projects/${p.slug}`}
                          target="_blank"
                          rel="noopener"
                          aria-label={`View ${p.title} on the website (opens in a new tab)`}
                          title="View on the website"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                      <IconButton label="Delete project" tone="danger" onClick={() => setPendingDelete(p)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="ml-1 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete “${pendingDelete.title}”?`}
          message="This permanently removes the project and its story. If you only want to hide it, open it and set Visibility to Draft or Archived instead."
          confirmLabel="Delete project"
          destructive
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
