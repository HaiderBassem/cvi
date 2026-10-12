'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Archive, ArchiveRestore, ArrowLeft, Copy, Inbox, Mail, MailOpen, Reply, Search, Trash2 } from 'lucide-react';
import type { ContactMessageRecord, MessageStatus } from '@/lib/db/types';
import { adminFetch, ApiError } from '@/components/admin/adminFetch';
import { Button, Card, ConfirmDialog, EmptyState, IconButton, PageHeader, SkeletonRows, StatusChip, cx } from '@/components/admin/ui';
import { LoadFailed } from '@/components/admin/AdminStates';
import { UNREAD_EVENT } from '@/components/admin/AdminShell';

type Filter = 'inbox' | 'new' | 'archived';
type Counts = { total: number; unread: number; archived: number };

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'new', label: 'Unread' },
  { id: 'archived', label: 'Archived' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortDate(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Does `m` still belong in the folder being viewed? */
function belongs(m: ContactMessageRecord, filter: Filter, keepId: string) {
  if (filter === 'archived') return m.status === 'archived';
  if (filter === 'new') return m.id === keepId || m.status === 'new';
  return m.status !== 'archived';
}

function MessagesInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get('open');

  const [filter, setFilter] = useState<Filter>('inbox');
  const [items, setItems] = useState<ContactMessageRecord[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(openId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const publishCounts = (c: Counts) => {
    setCounts(c);
    window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: c.unread }));
  };

  const setStatus = useCallback(
    async (id: string, status: MessageStatus, quiet = false) => {
      if (!quiet) setWorking(true);
      try {
        const data = await adminFetch<{ item: ContactMessageRecord; counts: Counts }>(`/api/admin/messages/${id}`, {
          method: 'PATCH',
          json: { status },
        });
        setItems((prev) => prev.map((m) => (m.id === id ? data.item : m)).filter((m) => belongs(m, filter, id)));
        publishCounts(data.counts);
        if (!quiet) {
          setNotice(status === 'archived' ? 'Message archived.' : status === 'new' ? 'Marked as unread.' : 'Moved back to the inbox.');
          if (status === 'archived' && filter !== 'archived') setSelectedId(null);
        }
      } catch (e) {
        setNotice(e instanceof ApiError ? e.message : 'Could not update the message.');
      } finally {
        if (!quiet) setWorking(false);
      }
    },
    [filter]
  );

  const load = useCallback(async (f: Filter, autoOpen: string | null) => {
    setState('loading');
    try {
      const data = await adminFetch<{ items: ContactMessageRecord[]; counts: Counts }>(`/api/admin/messages?filter=${f}`);
      setItems(data.items);
      publishCounts(data.counts);
      setState('ready');
      const target = autoOpen ? data.items.find((m) => m.id === autoOpen) : null;
      if (target && target.status === 'new') {
        // deep link from the overview: opening it reads it
        adminFetch<{ item: ContactMessageRecord; counts: Counts }>(`/api/admin/messages/${target.id}`, { method: 'PATCH', json: { status: 'read' } })
          .then((d) => {
            setItems((prev) => prev.map((m) => (m.id === target.id ? d.item : m)));
            publishCounts(d.counts);
          })
          .catch(() => {});
      }
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load(filter, openId);
    // openId is only honoured on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => [m.name, m.email, m.message, m.typology, m.scale].some((v) => v?.toLowerCase().includes(q)));
  }, [items, query]);

  const selected = items.find((m) => m.id === selectedId) ?? null;

  const open = (m: ContactMessageRecord) => {
    setSelectedId(m.id);
    setNotice(null);
    if (m.status === 'new') setStatus(m.id, 'read', true);
    router.replace(`/admin/messages?open=${m.id}`, { scroll: false });
  };

  const closeReader = () => {
    setSelectedId(null);
    router.replace('/admin/messages', { scroll: false });
  };

  const remove = async () => {
    if (!selected) return;
    setWorking(true);
    try {
      const data = await adminFetch<{ counts: Counts }>(`/api/admin/messages/${selected.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((m) => m.id !== selected.id));
      publishCounts(data.counts);
      setNotice('Message deleted.');
      closeReader();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Could not delete the message.');
    } finally {
      setWorking(false);
      setConfirmDelete(false);
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setNotice('Email address copied.');
    } catch {
      setNotice('Copy failed — select the address and copy it manually.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description={
          counts
            ? counts.unread > 0
              ? `${counts.unread} unread · briefs sent from the contact page`
              : 'You are all caught up.'
            : 'Briefs sent from the contact page.'
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div role="tablist" aria-label="Message folders" className="inline-flex self-start p-1 rounded-full border border-white/10 bg-white/[0.03]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setSelectedId(null);
              }}
              className={cx(
                'px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer',
                filter === f.id ? 'bg-white text-black font-medium' : 'text-white/60 hover:text-white'
              )}
            >
              {f.label}
              {f.id === 'new' && counts && counts.unread > 0 && <span className="ml-1.5 tabular-nums">{counts.unread}</span>}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search aria-hidden="true" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or text"
            aria-label="Search messages"
            className="w-full rounded-full border border-white/10 bg-black/30 pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-skyblue"
          />
        </div>
      </div>

      <div role="status" aria-live="polite" className={notice ? 'text-sm text-white/70 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2' : 'sr-only'}>
        {notice}
      </div>

      {state === 'error' ? (
        <LoadFailed what="your messages" onRetry={() => load(filter, null)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-4">
          {/* List */}
          <Card className={cx('overflow-hidden', selected && 'hidden lg:block')}>
            {state === 'loading' ? (
              <SkeletonRows rows={5} label="Loading messages" />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={<Inbox className="w-5 h-5" />}
                title={
                  query
                    ? 'No messages match your search'
                    : filter === 'archived'
                      ? 'Nothing archived'
                      : filter === 'new'
                        ? 'No unread messages'
                        : 'Your inbox is empty'
                }
                description={
                  query ? 'Try a different name or word.' : filter === 'inbox' ? 'When someone sends a brief from the contact page, it lands here.' : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto">
                {visible.map((m) => {
                  const active = m.id === selectedId;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => open(m)}
                        aria-current={active ? 'true' : undefined}
                        className={cx(
                          'w-full text-left px-4 py-3 flex gap-3 transition-colors cursor-pointer',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-skyblue',
                          active ? 'bg-skyblue/10' : 'hover:bg-white/[0.03]'
                        )}
                      >
                        <span aria-hidden="true" className={cx('mt-1.5 w-2 h-2 rounded-full shrink-0', m.status === 'new' ? 'bg-skyblue' : 'bg-transparent')} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={cx('truncate text-sm', m.status === 'new' ? 'text-white font-semibold' : 'text-white/85')}>
                              {m.name}
                              {m.status === 'new' && <span className="sr-only"> (unread)</span>}
                            </span>
                            <time dateTime={m.created_at} className="text-[11px] text-white/40 shrink-0">
                              {shortDate(m.created_at)}
                            </time>
                          </span>
                          {m.typology && <span className="block text-xs text-skyblue/80 truncate">{m.typology}</span>}
                          <span className="block text-xs text-white/45 truncate">{m.message}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Reading pane */}
          <Card className={cx('min-h-[320px]', !selected && 'hidden lg:block')}>
            {!selected ? (
              <EmptyState icon={<Mail className="w-5 h-5" />} title="Select a message" description="Pick a message on the left to read it here." />
            ) : (
              <article aria-labelledby="msg-subject" className="flex flex-col h-full">
                <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-white/10">
                  <Button variant="ghost" size="sm" className="lg:hidden -ml-2" onClick={closeReader}>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
                  </Button>
                  <div className="flex items-center gap-1 ml-auto">
                    {selected.status !== 'archived' ? (
                      <>
                        <IconButton label="Mark as unread" onClick={() => setStatus(selected.id, 'new')} disabled={working || selected.status === 'new'}>
                          <MailOpen className="w-4 h-4" />
                        </IconButton>
                        <IconButton label="Archive" onClick={() => setStatus(selected.id, 'archived')} disabled={working}>
                          <Archive className="w-4 h-4" />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton label="Move back to inbox" onClick={() => setStatus(selected.id, 'read')} disabled={working}>
                        <ArchiveRestore className="w-4 h-4" />
                      </IconButton>
                    )}
                    <IconButton label="Delete permanently" tone="danger" onClick={() => setConfirmDelete(true)} disabled={working}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-5 space-y-5 flex-1">
                  <header className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="msg-subject" className="text-xl font-semibold text-white">
                        {selected.name}
                      </h2>
                      {selected.status === 'archived' && <StatusChip>Archived</StatusChip>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <a href={`mailto:${selected.email}`} className="text-skyblue hover:underline break-all">
                        {selected.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyEmail(selected.email)}
                        className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy
                      </button>
                    </div>
                    <p className="text-xs text-white/40">
                      Received <time dateTime={selected.created_at}>{formatDate(selected.created_at)}</time>
                    </p>
                  </header>

                  {(selected.typology || selected.scale) && (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selected.typology && (
                        <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                          <dt className="font-mono text-[10px] uppercase tracking-widest text-white/40">Project type</dt>
                          <dd className="text-sm text-white mt-0.5">{selected.typology}</dd>
                        </div>
                      )}
                      {selected.scale && (
                        <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                          <dt className="font-mono text-[10px] uppercase tracking-widest text-white/40">Scale / budget</dt>
                          <dd className="text-sm text-white mt-0.5">{selected.scale}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap break-words">{selected.message}</div>
                </div>

                <div className="px-4 sm:px-5 py-4 border-t border-white/10">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: your project brief — CVI Architects')}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-skyblue text-black text-sm font-semibold hover:bg-skyblue-light transition-colors"
                  >
                    <Reply className="w-4 h-4" aria-hidden="true" /> Reply by email
                  </a>
                </div>
              </article>
            )}
          </Card>
        </div>
      )}

      {confirmDelete && selected && (
        <ConfirmDialog
          title="Delete this message?"
          message={`The brief from ${selected.name} will be removed for good. Archive it instead if you might need it later.`}
          confirmLabel="Delete message"
          cancelLabel="Keep it"
          destructive
          busy={working}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={5} label="Loading messages" />}>
      <MessagesInbox />
    </Suspense>
  );
}
