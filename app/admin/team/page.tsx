'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { TeamMemberRecord } from '@/lib/db/types';
import { adminFetch, ApiError } from '@/components/admin/adminFetch';
import { Button, ConfirmDialog, EmptyState, IconButton, PageHeader, StatusChip, cx } from '@/components/admin/ui';
import { FormBanner, ListSkeleton, LoadFailed } from '@/components/admin/AdminStates';
import Drawer from '@/components/admin/Drawer';
import SaveBar from '@/components/admin/SaveBar';
import ImageUpload from '@/components/admin/ImageUpload';
import { FormSection, TextArea, TextField, Toggle } from '@/components/admin/Field';
import { useRecordEditor } from '@/components/admin/useRecordEditor';

type MemberForm = {
  name: string;
  role: string;
  department: string;
  bio: string;
  avatar_url: string;
  is_leadership: number;
  is_visible: number;
};

const EMPTY: MemberForm = { name: '', role: '', department: '', bio: '', avatar_url: '', is_leadership: 1, is_visible: 1 };

function toForm(m: TeamMemberRecord): MemberForm {
  return {
    name: m.name,
    role: m.role,
    department: m.department || '',
    bio: m.bio || '',
    avatar_url: m.avatar_url || '',
    is_leadership: m.is_leadership ? 1 : 0,
    is_visible: m.is_visible === 0 ? 0 : 1,
  };
}

function MemberRow({
  member,
  onEdit,
  onToggleVisible,
  onDelete,
  disabled,
}: {
  member: TeamMemberRecord;
  onEdit: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });
  const hidden = member.is_visible === 0;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        'flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 bg-[#111116]',
        isDragging && 'relative z-10 shadow-2xl ring-1 ring-skyblue/50 rounded-md'
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${member.name}. Press space, then use the arrow keys.`}
        className="p-1.5 rounded text-white/52 hover:text-white cursor-grab active:cursor-grabbing touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
      >
        <GripVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className={cx('relative w-12 h-14 rounded overflow-hidden bg-white/5 shrink-0', hidden && 'opacity-40')}>
        {member.avatar_url && <Image src={member.avatar_url} alt="" fill className="object-cover" sizes="48px" />}
      </div>

      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left cursor-pointer group">
        <span className={cx('block text-sm font-medium truncate group-hover:text-skyblue', hidden ? 'text-white/60' : 'text-white')}>{member.name}</span>
        <span className="block text-xs text-white/60 truncate">
          {member.role}
          {member.department ? ` · ${member.department}` : ''}
        </span>
      </button>

      <div className="hidden sm:flex items-center gap-2">
        {member.is_leadership ? <StatusChip tone="accent">Leadership</StatusChip> : null}
        {hidden && <StatusChip>Hidden</StatusChip>}
      </div>

      <div className="flex items-center">
        <IconButton label={hidden ? `Show ${member.name} on the site` : `Hide ${member.name} from the site`} onClick={onToggleVisible} disabled={disabled}>
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </IconButton>
        <IconButton label={`Edit ${member.name}`} onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </IconButton>
        <IconButton label={`Delete ${member.name}`} tone="danger" onClick={onDelete} disabled={disabled}>
          <Trash2 className="w-4 h-4" />
        </IconButton>
      </div>
    </li>
  );
}

export default function TeamAdminPage() {
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [notice, setNotice] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState(false);
  const [toDelete, setToDelete] = useState<TeamMemberRecord | null>(null);
  const editor = useRecordEditor<MemberForm>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setState('loading');
    try {
      setMembers(await adminFetch<TeamMemberRecord[]>('/api/admin/team'));
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const before = members;
    const next = arrayMove(
      members,
      members.findIndex((m) => m.id === active.id),
      members.findIndex((m) => m.id === over.id)
    );
    setMembers(next);
    try {
      await adminFetch('/api/admin/team', { method: 'PUT', json: { ids: next.map((m) => m.id) } });
      setNotice('Order saved. The site shows the team in this order.');
    } catch (err) {
      setMembers(before);
      setNotice(err instanceof ApiError ? err.message : 'Could not save the new order. It has been put back.');
    }
  };

  const toggleVisible = async (m: TeamMemberRecord) => {
    setRowBusy(true);
    try {
      const updated = await adminFetch<TeamMemberRecord>(`/api/admin/team/${m.id}`, {
        method: 'PATCH',
        json: { is_visible: m.is_visible === 0 ? 1 : 0 },
      });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
      setNotice(updated.is_visible ? `${m.name} is shown on the site.` : `${m.name} is hidden from the site.`);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Could not change visibility.');
    } finally {
      setRowBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setRowBusy(true);
    try {
      await adminFetch(`/api/admin/team/${toDelete.id}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((x) => x.id !== toDelete.id));
      setNotice(`${toDelete.name} was removed.`);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Could not delete this member.');
    } finally {
      setRowBusy(false);
      setToDelete(null);
    }
  };

  const save = async () => {
    const form = editor.form;
    if (!form) return;
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.role.trim()) errs.role = 'Role is required.';
    if (!form.avatar_url) errs.avatar_url = 'Add a photo.';
    if (Object.keys(errs).length) {
      editor.setErrors(errs);
      editor.focusFirstError();
      return;
    }

    editor.setSaving(true);
    try {
      if (editor.isNew) {
        const created = await adminFetch<TeamMemberRecord>('/api/admin/team', { method: 'POST', json: form });
        setMembers((prev) => [...prev, created]);
        setNotice(`${created.name} was added.`);
      } else {
        const id = editor.session!.id!;
        const updated = await adminFetch<TeamMemberRecord>(`/api/admin/team/${id}`, { method: 'PATCH', json: form });
        setMembers((prev) => prev.map((x) => (x.id === id ? updated : x)));
        setNotice('Changes saved.');
      }
      editor.close();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        editor.setErrors(err.fieldErrors);
        editor.focusFirstError();
      } else {
        editor.setFormError(err instanceof ApiError ? err.message : 'Could not save. Your edits are still here.');
      }
    } finally {
      editor.setSaving(false);
    }
  };

  const f = editor.form;
  const problems = Object.keys(editor.errors).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="The people shown on the homepage and the About page. Drag to change the order."
        action={
          <Button onClick={() => editor.open(null, EMPTY)}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Add member
          </Button>
        }
      />

      <div role="status" aria-live="polite" className={notice ? 'text-sm text-white/70 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2' : 'sr-only'}>
        {notice}
      </div>

      {state === 'loading' ? (
        <ListSkeleton rows={4} />
      ) : state === 'error' ? (
        <LoadFailed what="the team" onRetry={load} />
      ) : members.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-[#111116]">
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No team members yet"
            description="Add the people behind the studio. They appear on the homepage and the About page."
            action={
              <Button onClick={() => editor.open(null, EMPTY)}>
                <Plus className="w-4 h-4" aria-hidden="true" /> Add the first member
              </Button>
            }
          />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={members.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <ul className="rounded-lg border border-white/10 overflow-hidden divide-y divide-white/5" aria-label="Team members">
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  disabled={rowBusy}
                  onEdit={() => editor.open(m.id, toForm(m))}
                  onToggleVisible={() => toggleVisible(m)}
                  onDelete={() => setToDelete(m)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editor.isOpen && f && (
        <Drawer
          title={editor.isNew ? 'Add team member' : `Edit ${editor.session?.initial.name}`}
          subtitle={editor.isNew ? 'Shown on the site as soon as you save.' : undefined}
          onClose={editor.requestClose}
          escapeDisabled={editor.confirmingClose}
          maxWidth="sm:max-w-xl"
          footer={
            <SaveBar
              variant="footer"
              mode={editor.isNew ? 'new' : 'edit'}
              dirty={editor.dirty}
              saving={editor.saving}
              busy={editor.busy}
              problems={problems}
              saveLabel={editor.isNew ? 'Add member' : 'Save changes'}
              discardLabel={editor.isNew ? 'Cancel' : 'Discard'}
              onSave={save}
              onDiscard={editor.isNew ? editor.requestClose : () => editor.open(editor.session!.id, editor.session!.initial)}
            />
          }
        >
          <FormBanner message={editor.formError} />
          <FormSection title="Person">
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
              <ImageUpload
                label="Photo"
                required
                aspect="aspect-[3/4]"
                value={f.avatar_url}
                onChange={(url) => editor.patch({ avatar_url: url })}
                onBusyChange={editor.setBusy}
                error={editor.errors.avatar_url}
              />
              <div className="space-y-4">
                <TextField
                  label="Full name"
                  required
                  maxLength={120}
                  value={f.name}
                  onChange={(v) => editor.patch({ name: v })}
                  error={editor.errors.name}
                  autoComplete="off"
                />
                <TextField
                  label="Role"
                  required
                  maxLength={120}
                  value={f.role}
                  onChange={(v) => editor.patch({ role: v })}
                  error={editor.errors.role}
                  placeholder="e.g. Principal Architect"
                />
                <TextField label="Department" maxLength={120} value={f.department} onChange={(v) => editor.patch({ department: v })} error={editor.errors.department} />
              </div>
            </div>
            <TextArea
              label="Short bio"
              maxLength={1200}
              rows={5}
              value={f.bio}
              onChange={(v) => editor.patch({ bio: v })}
              error={editor.errors.bio}
              hint="Two or three sentences read best."
            />
          </FormSection>
          <FormSection title="Display">
            <Toggle
              label="Show on the website"
              description="Hidden members stay here but leave the public pages."
              checked={f.is_visible === 1}
              onChange={(v) => editor.patch({ is_visible: v ? 1 : 0 })}
            />
            <Toggle
              label="Leadership"
              description="Marks this person as part of the studio leadership."
              checked={f.is_leadership === 1}
              onChange={(v) => editor.patch({ is_leadership: v ? 1 : 0 })}
            />
          </FormSection>
          {editor.discardDialog}
        </Drawer>
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Remove ${toDelete.name}?`}
          message="They will disappear from the website and from this list. To take them off the site but keep the profile, hide them instead."
          confirmLabel="Remove member"
          cancelLabel="Keep"
          destructive
          busy={rowBusy}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
