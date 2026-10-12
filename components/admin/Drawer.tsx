'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './ui';

interface Props {
  title: React.ReactNode;
  /** Small line under the title (status, link to the live page, ...). */
  subtitle?: React.ReactNode;
  /** Asked to close: Escape, the backdrop, the X. The page decides (it may confirm first). */
  onClose: () => void;
  /** Turn Escape off while a confirm dialog on top of the drawer owns it. */
  escapeDisabled?: boolean;
  children: React.ReactNode;
  /** Pinned under the scrolling body (the save bar). */
  footer?: React.ReactNode;
  /** Tailwind max-width for the panel. */
  maxWidth?: string;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Side panel for create/edit. Slides in from the right, keeps the list visible
 * behind it, locks page scroll, traps Tab and gives focus back on close.
 * Full-width on a phone.
 */
export default function Drawer({ title, subtitle, onClose, escapeDisabled = false, children, footer, maxWidth = 'sm:max-w-2xl' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const escapeDisabledRef = useRef(escapeDisabled);
  escapeDisabledRef.current = escapeDisabled;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => setEntered(true));
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (escapeDisabledRef.current) return;
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        aria-hidden="true"
        onClick={() => onCloseRef.current()}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-200 motion-reduce:transition-none ${entered ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={[
          'absolute inset-y-0 right-0 w-full flex flex-col outline-none',
          'border-l border-white/15 bg-[#111116] shadow-2xl',
          'transition-transform duration-200 ease-out motion-reduce:transition-none',
          maxWidth,
          entered ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white leading-tight">{title}</h2>
            {subtitle && <div className="mt-1 text-xs text-white/50">{subtitle}</div>}
          </div>
          <IconButton label="Close" onClick={() => onCloseRef.current()}>
            <X className="w-4 h-4" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">{children}</div>
        {footer}
      </div>
    </div>
  );
}
