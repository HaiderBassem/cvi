'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { NavigationItemRecord } from '@/lib/db/types';
import { adminFetch, ApiError } from '@/components/admin/adminFetch';
import { Button, Card, ConfirmDialog, IconButton, PageHeader, StatusChip } from '@/components/admin/ui';
import { FormBanner, ListSkeleton, LoadFailed } from '@/components/admin/AdminStates';
import { TextField } from '@/components/admin/Field';
import SaveBar from '@/components/admin/SaveBar';
import { useUnsavedGuard } from '@/components/admin/useUnsavedGuard';

type Item = Pick<NavigationItemRecord, 'id' | 'label' | 'href' | 'is_visible' | 'is_external'> & { hint: string };

const toItems = (rows: NavigationItemRecord[]): Item[] =>
  rows.map((r) => ({ id: r.id, label: r.label, href: r.href, hint: r.hint ?? '', is_visible: r.is_visible, is_external: r.is_external }));

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AdminNavigationPage() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saved, setSaved] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const rows = toItems(await adminFetch<NavigationItemRecord[]>('/api/admin/navigation'));
      setSaved(rows);
      setItems(rows);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = JSON.stringify(items) !== JSON.stringify(saved);
  const { guard } = useUnsavedGuard(dirty);

  const patch = (i: number, p: Partial<Item>) => {
    setItems((list) => list.map((x, j) => (j === i ? { ...x, ...p } : x)));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(p).forEach((k) => delete next[`items.${i}.${k}`]);
      return next;
    });
    setNotice(null);
  };

  const save = async () => {
    const problems: Record<string, string> = {};
    items.forEach((it, i) => {
      if (!it.label.trim()) problems[`items.${i}.label`] = 'Give the link a name.';
      if (!it.href.trim()) problems[`items.${i}.href`] = 'Add where the link goes.';
    });
    if (Object.keys(problems).length) {
      setErrors(problems);
      setFormError('Some links need attention before this can be saved.');
      return;
    }
    setSaving(true);
    setFormError(null);
    setErrors({});
    try {
      const rows = toItems(await adminFetch<NavigationItemRecord[]>('/api/admin/navigation', { method: 'PUT', json: { items } }));
      setSaved(rows);
      setItems(rows);
      setNotice('Saved. The live menu now shows these links.');
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrors(err.fieldErrors);
        setFormError('Some links need attention before this can be saved.');
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not save. Your edits are still here.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (state === 'loading') return <ListSkeleton rows={4} />;
  if (state === 'error') return <LoadFailed what="the menu" onRetry={load} />;

  return (
    <div className="space-y-6">
      {guard}
      <PageHeader
        title="Menu & navigation"
        description="The links in the website's top bar and phone menu. Change the names, the order, what each link says, or hide one. (The small “Admin login” line is always available and is not part of this list.)"
        action={
          <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-skyblue">
            Open live site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        }
      />

      <div role="status" aria-live="polite" className={notice ? 'rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70' : 'sr-only'}>
        {notice}
      </div>
      <FormBanner message={formError} />

      <Card>
        <ul className="divide-y divide-white/[0.07]">
          {items.map((it, i) => (
            <li key={it.id} className={it.is_visible ? '' : 'bg-black/20'}>
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white/60">{i + 1}</span>
                    {!it.is_visible && <StatusChip tone="neutral">Hidden</StatusChip>}
                    {it.is_external === 1 && <StatusChip tone="accent">Opens a new tab</StatusChip>}
                  </div>
                  <div className="flex items-center">
                    <IconButton label="Move up" disabled={i === 0} onClick={() => setItems((l) => move(l, i, i - 1))}>
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => setItems((l) => move(l, i, i + 1))}>
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                    <IconButton label={it.is_visible ? 'Hide this link' : 'Show this link'} onClick={() => patch(i, { is_visible: it.is_visible ? 0 : 1 })}>
                      {it.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-skyblue" />}
                    </IconButton>
                    <IconButton label="Delete this link" tone="danger" onClick={() => setPendingDelete(i)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField label="Name" required maxLength={30} value={it.label} error={errors[`items.${i}.label`]} onChange={(v) => patch(i, { label: v })} />
                  <TextField
                    label="Goes to"
                    required
                    maxLength={300}
                    value={it.href}
                    placeholder="/projects"
                    hint="A page of this site, like /about, or a full https:// link."
                    error={errors[`items.${i}.href`]}
                    onChange={(v) => patch(i, { href: v, is_external: /^https:\/\//.test(v) ? 1 : 0 })}
                  />
                  <TextField
                    className="sm:col-span-2"
                    label="Short description (phone menu)"
                    maxLength={80}
                    value={it.hint}
                    placeholder="Our architecture and design work"
                    error={errors[`items.${i}.hint`]}
                    onChange={(v) => patch(i, { hint: v })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/[0.07] p-4 sm:p-5">
          <Button
            variant="secondary"
            size="sm"
            disabled={items.length >= 10}
            onClick={() => setItems((l) => [...l, { id: `new_${Date.now().toString(36)}`, label: '', href: '', hint: '', is_visible: 1, is_external: 0 }])}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add a link
          </Button>
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={save}
        onDiscard={() => {
          setItems(saved);
          setErrors({});
          setFormError(null);
        }}
      />

      {pendingDelete !== null && (
        <ConfirmDialog
          title="Delete this link?"
          message={`“${items[pendingDelete]?.label || 'This link'}” will be removed from the menu when you save.`}
          confirmLabel="Delete link"
          destructive
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            setItems((l) => l.filter((_, j) => j !== pendingDelete));
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
