'use client';

import React, { useId, useRef, useState } from 'react';
import { Box, CheckCircle2, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { cx } from './ui';

export interface PickerModel {
  id: string;
  label: string;
  bytes: number;
  triangles: number;
  source: 'builtin' | 'upload';
  usedBy?: number;
}

interface Props {
  models: PickerModel[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** A model was just uploaded and converted. */
  onModelAdded: (model: PickerModel) => void;
  /** Tells the editor an upload is running, so Save waits for it. */
  onBusyChange?: (busy: boolean) => void;
  error?: string;
}

const MAX_BYTES = 250 * 1024 * 1024;
type Phase = 'idle' | 'uploading' | 'converting' | 'done' | 'error';

const mb = (b: number) => `${(b / 1048576).toFixed(b < 1048576 * 10 ? 1 : 0)} MB`;

/**
 * Picks the 3D model shown behind a project page — from the library, or by uploading a new
 * one. FBX is the only accepted format; the server converts it to the light web format.
 */
export default function ModelPicker({ models, value, onChange, onModelAdded, onBusyChange, error }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const current = value ? models.find((m) => m.id === value) : null;
  const working = phase === 'uploading' || phase === 'converting';

  const upload = (file: File) => {
    setMessage(null);
    if (!file.name.toLowerCase().endsWith('.fbx')) {
      setPhase('error');
      setMessage('Only .fbx files can be used for 3D models.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase('error');
      setMessage('That file is larger than 250 MB. Export a lighter version of the model.');
      return;
    }

    const form = new FormData();
    form.append('file', file);
    if (name.trim()) form.append('label', name.trim());

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/models/upload');
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(e.loaded / e.total);
    xhr.upload.onload = () => setPhase('converting');
    xhr.onerror = () => {
      setPhase('error');
      setMessage('Could not reach the server. Check your connection and try again.');
      onBusyChange?.(false);
    };
    xhr.onload = () => {
      onBusyChange?.(false);
      let body: { success?: boolean; data?: PickerModel; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status === 401) {
        window.location.href = `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data) {
        onModelAdded({ ...body.data, usedBy: 0 });
        onChange(body.data.id);
        setPhase('done');
        setName('');
        setMessage(`“${body.data.label}” is ready (${mb(body.data.bytes)}, ${Math.round(body.data.triangles / 1000)}k triangles) and selected for this project.`);
      } else {
        setPhase('error');
        setMessage(body.error || `Upload failed (${xhr.status}). Please try again.`);
      }
    };

    setPhase('uploading');
    setProgress(0);
    onBusyChange?.(true);
    xhr.send(form);
  };

  return (
    <div className="space-y-4">
      {/* What the project uses now */}
      <div className={cx('flex items-center gap-3 rounded-md border px-3.5 py-3', current ? 'border-skyblue/30 bg-skyblue/[0.06]' : 'border-white/10 bg-black/20')}>
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/30 text-skyblue">
          <Box className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          {current ? (
            <>
              <p className="truncate text-sm font-medium text-white">{current.label}</p>
              <p className="text-xs text-white/55">
                {mb(current.bytes)} · {Math.round(current.triangles / 1000)}k triangles · {current.source === 'upload' ? 'uploaded' : 'studio library'}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-white">No 3D model</p>
              <p className="text-xs text-white/55">The cover image is used as the page background.</p>
            </>
          )}
        </div>
        {current && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-white/65 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
          </button>
        )}
      </div>

      {/* Choose an existing one */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-select`} className="text-xs font-medium text-white/80">
          Choose from the library
        </label>
        <select
          id={`${id}-select`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-invalid={error ? true : undefined}
          className="w-full rounded-md border border-white/10 bg-[#16161b] px-3 py-2 text-sm text-white focus:border-skyblue focus:outline-none focus:ring-1 focus:ring-skyblue/40"
        >
          <option value="">None — use the cover image</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({mb(m.bytes)}){m.usedBy && m.id !== value ? ` · used by ${m.usedBy}` : ''}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>

      {/* Upload a new one */}
      <div className="space-y-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className="text-xs font-medium text-white/80">
            Name for a new model <span className="text-white/56">(optional)</span>
          </label>
          <input
            id={`${id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={working}
            placeholder="Taken from the file name if left empty"
            className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-skyblue focus:outline-none focus:ring-1 focus:ring-skyblue/40 disabled:opacity-50"
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!working) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f && !working) upload(f);
          }}
          className={cx(
            'relative rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragOver ? 'border-skyblue bg-skyblue/[0.06]' : 'border-white/15 bg-black/20',
            phase === 'error' && 'border-red-400/50'
          )}
        >
          {working ? (
            <div role="status" className="mx-auto max-w-sm space-y-3">
              <p className="flex items-center justify-center gap-2 text-sm text-white">
                <Loader2 className="h-4 w-4 animate-spin text-skyblue" aria-hidden="true" />
                {phase === 'uploading' ? `Uploading… ${Math.round(progress * 100)}%` : 'Optimising the model for the web…'}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cx('h-full rounded-full bg-skyblue transition-[width] duration-300', phase === 'converting' && 'animate-pulse')}
                  style={{ width: phase === 'converting' ? '100%' : `${Math.max(3, progress * 100)}%` }}
                />
              </div>
              {phase === 'converting' && <p className="text-xs text-white/55">Large files can take up to a minute. Please keep this page open.</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="mx-auto flex cursor-pointer flex-col items-center gap-2 text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
            >
              <UploadCloud className="h-7 w-7 text-skyblue" aria-hidden="true" />
              <span className="text-sm font-medium">Drop an .fbx file here, or click to choose one</span>
              <span className="text-xs text-white/50">FBX only · up to 250 MB · it is converted automatically into a light web version</span>
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept=".fbx"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = '';
            }}
          />
        </div>

        {message && (
          <p
            role={phase === 'error' ? 'alert' : 'status'}
            className={cx('flex items-start gap-2 rounded-md px-3 py-2 text-sm', phase === 'error' ? 'bg-red-500/[0.08] text-red-200' : 'bg-emerald-400/[0.08] text-emerald-200')}
          >
            {phase === 'done' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
            <span>{message}</span>
          </p>
        )}
      </div>
    </div>
  );
}
