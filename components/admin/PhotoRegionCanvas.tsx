'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { cx } from './ui';

/** A rectangle on the photo; every number is a percentage (0–100) of the photo's width / height. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CanvasBox {
  id: string;
  label: string;
  rect: Rect;
  /** `current` = the person being edited, `other` = everyone else. */
  tone: 'current' | 'other';
}

interface Props {
  photo: string;
  boxes: CanvasBox[];
  /** A finished drag: the new rectangle. */
  onDraw: (rect: Rect) => void;
  /** A plain click that landed on a box (the smallest one, when several overlap). */
  onSelect?: (id: string) => void;
  ariaLabel: string;
}

const clamp = (v: number) => Math.min(Math.max(v, 0), 100);
/** Under this many pixels of movement a press is a click, not a drag. */
const CLICK_SLOP_PX = 6;

/**
 * The group photo with a box over each placed person. Drag on the photo to draw a box; click a box
 * to pick it. Everything is in percentages, so it stays right at any size.
 */
export default function PhotoRegionCanvas({ photo, boxes, onDraw, onSelect, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);

  const point = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };

  const rectBetween = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const p = point(e);
    start.current = { ...p, px: e.clientX, py: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDraft(rectBetween(start.current, point(e)));
  };

  const finish = (e: React.PointerEvent, commit: boolean) => {
    const s = start.current;
    start.current = null;
    setDraft(null);
    if (!s || !commit) return;
    const moved = Math.hypot(e.clientX - s.px, e.clientY - s.py);
    const end = point(e);
    if (moved < CLICK_SLOP_PX) {
      const hit = boxes
        .filter((b) => s.x >= b.rect.x && s.x <= b.rect.x + b.rect.w && s.y >= b.rect.y && s.y <= b.rect.y + b.rect.h)
        .sort((a, b) => a.rect.w * a.rect.h - b.rect.w * b.rect.h)[0];
      if (hit) onSelect?.(hit.id);
      return;
    }
    const r = rectBetween(s, end);
    if (r.w >= 2 && r.h >= 2) onDraw({ x: r.x, y: r.y, w: r.w, h: r.h });
  };

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/30"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, true)}
      onPointerCancel={(e) => finish(e, false)}
    >
      <Image
        src={photo}
        alt=""
        width={0}
        height={0}
        sizes="(max-width: 768px) 100vw, 720px"
        unoptimized
        draggable={false}
        className="pointer-events-none block h-auto w-full"
      />
      {boxes.map((b) => (
        <div
          key={b.id}
          className={cx(
            'pointer-events-none absolute rounded-[10px] border-2',
            b.tone === 'current' ? 'z-10 border-skyblue bg-skyblue/20' : 'border-white/70 bg-white/10'
          )}
          style={{ left: `${b.rect.x}%`, top: `${b.rect.y}%`, width: `${b.rect.w}%`, height: `${b.rect.h}%` }}
        >
          <span
            className={cx(
              'absolute left-0 top-0 max-w-full -translate-y-full truncate rounded-t px-1.5 py-0.5 text-[10px] font-medium leading-none',
              b.tone === 'current' ? 'bg-skyblue text-black' : 'bg-black/75 text-white'
            )}
          >
            {b.label}
          </span>
        </div>
      ))}
      {draft && (
        <div
          className="pointer-events-none absolute z-20 rounded-[10px] border-2 border-dashed border-skyblue bg-skyblue/25"
          style={{ left: `${draft.x}%`, top: `${draft.y}%`, width: `${draft.w}%`, height: `${draft.h}%` }}
        />
      )}
    </div>
  );
}
