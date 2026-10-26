'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface BeforeAfterSliderProps {
  title?: string;
  beforeImage: string;
  beforeLabel?: string;
  afterImage: string;
  afterLabel?: string;
  initialPosition?: number;
}

export function BeforeAfterSlider({
  title = 'Solar Illumination Comparison',
  beforeImage,
  beforeLabel = 'Daylight Solar Glare',
  afterImage,
  afterLabel = 'Evening Radiance',
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(initialPosition);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  // Pointer events cover mouse, pen and finger. The slider takes over horizontal drags
  // (touch-action: pan-y) while vertical swipes still scroll the page past it. A finger only
  // moves the handle once it drags sideways or lifts as a tap, so scrolling past never nudges it.
  const touchStart = useRef<{ x: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.pointerType === 'mouse') handleMove(e.clientX);
    else touchStart.current = { x: e.clientX, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const touch = touchStart.current;
    if (touch) {
      // The browser sends a few moves before it decides a vertical swipe is a page scroll.
      if (!touch.moved && Math.abs(e.clientX - touch.x) <= 6) return;
      touch.moved = true;
    }
    handleMove(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchStart.current && !touchStart.current.moved) handleMove(e.clientX);
    touchStart.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSliderPos((p) => Math.max(0, p - 5));
    else if (e.key === 'ArrowRight') setSliderPos((p) => Math.min(100, p + 5));
  };

  return (
    <div className="w-full my-12 sm:my-20">
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs text-white/76">
          <span className="tracking-widest uppercase">{title}</span>
          <span className="text-white/62">[ DRAG TO REVEAL ]</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] sm:aspect-[21/9] touch-pan-y overflow-hidden select-none cursor-ew-resize border border-white/10"
        data-cursor="drag"
        role="slider"
        tabIndex={0}
        aria-label={`${title}: drag to compare ${beforeLabel} with ${afterLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPos)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (touchStart.current = null)}
        onKeyDown={onKeyDown}
      >
        {/* After Image (Background full) */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={afterImage}
            alt={afterLabel}
            fill
            draggable={false}
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1600px"
          />
          <div className="absolute bottom-3 right-3 max-w-[45%] bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-xs tracking-wider text-white/90 sm:bottom-4 sm:right-4 sm:max-w-none sm:tracking-widest">
            {afterLabel}
          </div>
        </div>

        {/* Before Image (Clipped overlay) */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <Image
            src={beforeImage}
            alt={beforeLabel}
            fill
            draggable={false}
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1600px"
          />
          <div className="absolute bottom-3 left-3 max-w-[45%] bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-xs tracking-wider text-white/90 sm:bottom-4 sm:left-4 sm:max-w-none sm:tracking-widest">
            {beforeLabel}
          </div>
        </div>

        {/* Slider Divider Line & Thumb */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-2xl z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-mono text-xs font-bold shadow-2xl">
            ◄►
          </div>
        </div>
      </div>
    </div>
  );
}
