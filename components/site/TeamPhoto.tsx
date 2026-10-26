'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { TeamMemberRecord } from '@/lib/db/types';

/** A team member who has been placed on the group photo (all four numbers are set). */
type Placed = TeamMemberRecord & { photo_x: number; photo_y: number; photo_w: number; photo_h: number };

const isPlaced = (m: TeamMemberRecord): m is Placed =>
  [m.photo_x, m.photo_y, m.photo_w, m.photo_h].every((v) => typeof v === 'number' && Number.isFinite(v));

interface Props {
  /** The group photo, shown exactly as uploaded. */
  photo: string;
  members: TeamMemberRecord[];
  /** Short line under the photo, for computers / for phones. */
  hint: string;
  touchHint: string;
  /** The photo's real size in pixels, so its space is reserved before it loads. */
  photoWidth: number;
  photoHeight: number;
  /** `light` = the photo sits on a pale page, `dark` = on a dark one (only the caption colour changes). */
  tone?: 'light' | 'dark';
}

/** Soft edges, so the photo melts into the page instead of ending in a hard rectangle. */
const FEATHER: React.CSSProperties = {
  WebkitMaskImage:
    'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)',
  maskImage:
    'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)',
  WebkitMaskComposite: 'source-in',
  maskComposite: 'intersect',
};

function InfoCard({ m, className = '', style }: { m: Placed; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={`team-card-in rounded-xl bg-[#101014]/95 p-5 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur ${className}`}
      style={style}
    >
      <div className="flex items-center gap-3">
        {m.avatar_url && (
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
            <Image src={m.avatar_url} alt="" fill sizes="44px" className="object-cover" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-grotesk text-lg font-semibold leading-tight">{m.name}</h3>
          <p className="mt-0.5 font-mono text-xs text-skyblue">{m.role}</p>
        </div>
      </div>
      {m.department && <p className="mt-3 font-mono text-xs text-white/60">{m.department}</p>}
      {m.bio && <p className="mt-2 text-[13px] leading-relaxed text-white/80">{m.bio}</p>}
    </div>
  );
}

/**
 * The team, as one group photo. Hover a person (or tap, on a phone) and the rest of the picture
 * dims, they are outlined, and their details appear. Each person is an invisible rectangle laid
 * over the photo — positions are set in Admin → Team.
 */
export default function TeamPhoto({ photo, members, hint, touchHint, photoWidth, photoHeight, tone = 'light' }: Props) {
  const placed = members.filter(isPlaced);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef('');
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const active = placed.find((m) => m.id === (hovered ?? pinned ?? focused)) ?? null;
  // Keep the last outline around so it can fade out (and glide to the next person) instead of vanishing.
  const lastActive = useRef<Placed | null>(null);
  if (active) lastActive.current = active;
  const ghost = active ?? lastActive.current;

  // A tapped (pinned) card closes on a tap elsewhere or on Escape.
  useEffect(() => {
    if (!pinned && !hovered) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPinned(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPinned(null);
      setHovered(null);
      setFocused(null);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned, hovered]);

  // Back to front: whoever's feet are lowest in the photo stands in front, so where two boxes
  // overlap the person in front wins and nobody steals the hover from the person seated before them.
  const ordered = [...placed].sort((a, b) => a.photo_y + a.photo_h - (b.photo_y + b.photo_h));

  const captionTone = tone === 'dark' ? 'text-white/60' : 'text-[#5b564a]';

  // Which side of the person the card opens on, and where vertically (kept inside the photo).
  const cardStyle = (m: Placed): React.CSSProperties => {
    const centreX = m.photo_x + m.photo_w / 2;
    const centreY = Math.min(Math.max(m.photo_y + m.photo_h / 2, 26), 74);
    return {
      ...(centreX < 50 ? { left: `${m.photo_x + m.photo_w + 1.5}%` } : { right: `${100 - m.photo_x + 1.5}%` }),
      top: `${centreY}%`,
      transform: 'translateY(-50%)',
    };
  };

  return (
    <div ref={rootRef}>
      {/* On a phone the photo is wider than the screen so people are big enough to tap: swipe sideways. */}
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0">
        <div
          // The photo's backdrop is the site's own paper colour. On the cream pages its edges dissolve into
          // the page; on the dark About page it sits on a matching paper card.
          className={`relative min-w-[860px] overflow-hidden sm:min-w-0 ${tone === 'dark' ? 'rounded-sm bg-[#e9dec9]' : ''}`}
          onClick={() => setPinned(null)}
        >
          <Image
            src={photo}
            alt="The CVI team, together in the studio"
            width={photoWidth}
            height={photoHeight}
            sizes="(max-width: 640px) 860px, 100vw"
            className="block h-auto w-full select-none"
            style={tone === 'dark' ? undefined : FEATHER}
            draggable={false}
          />

          {ghost && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-10 rounded-[14px] border border-[#283f7d]/55 transition-[left,top,width,height,opacity] duration-300 ease-out"
              style={{
                left: `${ghost.photo_x}%`,
                top: `${ghost.photo_y}%`,
                width: `${ghost.photo_w}%`,
                height: `${ghost.photo_h}%`,
                opacity: active ? 1 : 0,
                // A wash in the page's own cream: everyone else fades back, the chosen person stays sharp.
                boxShadow: '0 0 0 100vmax rgba(233, 222, 201, 0.55)',
              }}
            />
          )}

          {ordered.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-label={`${m.name}, ${m.role}`}
              aria-pressed={pinned === m.id}
              className="absolute z-[5] cursor-pointer rounded-[14px] bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ left: `${m.photo_x}%`, top: `${m.photo_y}%`, width: `${m.photo_w}%`, height: `${m.photo_h}%` }}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'touch') setHovered(m.id);
              }}
              onPointerLeave={() => setHovered((h) => (h === m.id ? null : h))}
              onPointerDown={(e) => {
                pointerType.current = e.pointerType;
              }}
              onClick={(e) => {
                e.stopPropagation();
                // A mouse already shows the card on hover; a tap or the keyboard pins it open.
                if (pointerType.current === 'mouse') return;
                setPinned((p) => (p === m.id ? null : m.id));
              }}
              onFocus={(e) => {
                if (e.currentTarget.matches(':focus-visible')) setFocused(m.id);
              }}
              onBlur={() => setFocused((f) => (f === m.id ? null : f))}
            />
          ))}

          {active && <InfoCard key={active.id} m={active} className="pointer-events-none absolute z-20 hidden w-[17.5rem] sm:block" style={cardStyle(active)} />}
        </div>
      </div>

      {placed.length > 0 && (
        <>
          <p className={`mt-4 hidden font-mono text-xs sm:block ${captionTone}`}>{hint}</p>
          {/* Phones: the card opens under the photo, where the thumb is not covering it. */}
          <div className="mt-4 min-h-[9.5rem] sm:hidden">
            {active ? <InfoCard key={active.id} m={active} className="w-full" /> : <p className={`font-mono text-xs ${captionTone}`}>{touchHint}</p>}
          </div>
        </>
      )}

      {/* The same information for screen readers and search engines. */}
      <ul className="sr-only">
        {placed.map((m) => (
          <li key={m.id}>
            {m.name}, {m.role}. {m.department} {m.bio}
          </li>
        ))}
      </ul>
    </div>
  );
}
