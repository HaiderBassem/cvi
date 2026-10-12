'use client';

import React, { useId, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { cx } from './ui';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
const MAX_BYTES = 15 * 1024 * 1024;

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Tells the parent an upload is in flight, so Save can wait for it. */
  onBusyChange?: (busy: boolean) => void;
  error?: string;
  required?: boolean;
  aspect?: string;
  hint?: string;
}

/**
 * Image field: drop or pick a file, it uploads to the media library, the URL
 * is stored. Shows the current image with Replace / Remove, and says plainly
 * what went wrong when an upload fails.
 */
export default function ImageUpload({ label, value, onChange, onBusyChange, error, required, aspect = 'aspect-[4/3]', hint }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    setUploadError(null);
    if (!ACCEPT.split(',').includes(file.type)) {
      setUploadError('Use a JPG, PNG, WebP, GIF or AVIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('That image is larger than 15 MB. Export a smaller version and try again.');
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('altText', label);
      const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.error || 'Upload failed. Please try again.');
      onChange(body.data.url as string);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const shownError = uploadError || error;

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-xs font-medium text-white/80">
        {label}
        {required && <span className="text-skyblue"> *</span>}
      </span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        className={cx(
          'relative overflow-hidden rounded-md border bg-black/30 transition-colors',
          aspect,
          dragOver ? 'border-skyblue bg-skyblue/5' : shownError ? 'border-red-400/60' : 'border-white/10'
        )}
      >
        {value ? (
          <Image src={value} alt="" fill className="object-cover" sizes="400px" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-labelledby={`${id}-label`}
            aria-invalid={shownError ? true : undefined}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/55 hover:text-white transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
          >
            <ImagePlus className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs">Drop an image or click to upload</span>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 text-sm text-white" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Uploading…
          </div>
        )}
      </div>

      {value && !uploading && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Replace
          </button>
          {!required && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Remove
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />

      {shownError ? <p className="text-xs text-red-300">{shownError}</p> : hint ? <p className="text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}
