'use client';

import React from 'react';
import { Check, Save } from 'lucide-react';
import { Button } from './ui';

interface Props {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saveLabel?: string;
  discardLabel?: string;
  /** Count of things the user must fix before saving works; shown as a hint. */
  problems?: number;
  /** An upload is running; saving now would drop the file still travelling. */
  busy?: boolean;
  /** `floating` sticks to the bottom of the page; `footer` sits inside a drawer. */
  variant?: 'floating' | 'footer';
  /** Extra controls on the left (e.g. a delete button in a drawer). */
  leading?: React.ReactNode;
  /** `new` records are never "saved" yet: Save stays enabled, wording changes. */
  mode?: 'edit' | 'new';
}

/** Save / Discard with an honest unsaved-changes indicator. */
export default function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  saveLabel = 'Save changes',
  discardLabel = 'Discard',
  problems = 0,
  busy = false,
  variant = 'floating',
  leading,
  mode = 'edit',
}: Props) {
  const isNew = mode === 'new';
  const shell =
    variant === 'floating'
      ? 'sticky bottom-4 z-20 rounded-lg border border-white/15 bg-[#14141a]/95 backdrop-blur px-4 py-3 shadow-2xl'
      : 'border-t border-white/10 bg-[#111116] px-5 py-3';

  return (
    <div className={`${shell} flex flex-wrap items-center gap-x-4 gap-y-2`} role="region" aria-label="Save changes">
      {leading}
      <p className="flex items-center gap-2 text-sm min-w-0 mr-auto" aria-live="polite">
        {dirty || isNew ? (
          <>
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-skyblue shrink-0" />
            <span className="text-white font-medium">{isNew ? 'Not saved yet' : 'Unsaved changes'}</span>
            {problems > 0 && (
              <span className="text-red-300">
                · {problems} {problems === 1 ? 'field needs' : 'fields need'} attention
              </span>
            )}
          </>
        ) : (
          <>
            <Check aria-hidden="true" className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-white/55">All changes saved</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onDiscard} disabled={(!dirty && !isNew) || saving}>
          {discardLabel}
        </Button>
        <Button onClick={onSave} loading={saving} disabled={(!dirty && !isNew) || busy}>
          {!saving && <Save aria-hidden="true" className="w-4 h-4" />}
          {saving ? 'Saving…' : busy ? 'Uploading…' : saveLabel}
        </Button>
      </div>
    </div>
  );
}
