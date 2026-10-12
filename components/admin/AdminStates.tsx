'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui';

/** A failed load with a way out: say what happened, offer a retry. */
export function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-400/30 bg-red-500/[0.06] px-5 py-8 text-center">
      <AlertCircle aria-hidden="true" className="w-6 h-6 mx-auto mb-2 text-red-300" />
      <p className="font-medium text-white">Could not load {what}.</p>
      <p className="mt-1 text-sm text-white/55">Check your connection, then try again. Nothing was lost.</p>
      <Button className="mt-4" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** Form-level message for a server rejection that names no single field. */
export function FormBanner({ message }: { message: string | null }) {
  return message ? (
    <div role="alert" className="flex gap-3 rounded-md border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-sm text-white">
      <AlertCircle aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-red-300" />
      <p>{message}</p>
    </div>
  ) : null;
}

/** Placeholder rows while a list loads. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#111116] px-4 divide-y divide-white/5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
          <div className="w-12 h-12 rounded-md bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-4 w-2/3 rounded bg-white/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
}
