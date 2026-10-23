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
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="w-full my-12 sm:my-20">
      {title && (
        <div className="flex items-center justify-between mb-4 font-mono text-xs text-white/76">
          <span className="tracking-widest uppercase">{title}</span>
          <span className="text-white/62">[ DRAG TO REVEAL ]</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden select-none cursor-ew-resize border border-white/10"
        data-cursor="drag"
        onMouseDown={() => (isDragging.current = true)}
        onMouseUp={() => (isDragging.current = false)}
        onMouseLeave={() => (isDragging.current = false)}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
      >
        {/* After Image (Background full) */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={afterImage}
            alt={afterLabel}
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1600px"
          />
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-xs tracking-widest text-white/90">
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
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1600px"
          />
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-xs tracking-widest text-white/90">
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
