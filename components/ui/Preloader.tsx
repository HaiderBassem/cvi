'use client';

import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  onComplete?: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    // Check if user already saw preloader in this session
    const hasSeen = sessionStorage.getItem('cvi_preloader_seen');
    if (hasSeen) {
      setIsDismissed(true);
      if (onComplete) onComplete();
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 14) + 6;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          dismiss();
        }, 400);
      }
      setProgress(current);
    }, 60);

    const dismiss = () => {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          yPercent: -100,
          duration: 1.1,
          ease: 'power4.inOut',
          onComplete: () => {
            setIsDismissed(true);
            sessionStorage.setItem('cvi_preloader_seen', 'true');
            if (onComplete) onComplete();
          },
        });
      }
    };

    return () => clearInterval(interval);
  }, [onComplete]);

  if (isDismissed) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] bg-[#f5f3ef] text-[#111114] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
    >
      {/* CAD Architectural Crosshair Guides */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/10 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/10 -translate-x-1/2" />
      </div>

      {/* Precision CAD Bounding Box */}
      <div className="relative border border-black/20 p-8 sm:p-12 max-w-xl w-full flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm shadow-xl">
        {/* Dimension Ticks */}
        <div className="absolute -top-3 left-4 text-[10px] font-mono tracking-widest text-black/60 bg-[#f5f3ef] px-2">
          WIDTH: 248.16 MM
        </div>
        <div className="absolute -bottom-3 right-4 text-[10px] font-mono tracking-widest text-black/60 bg-[#f5f3ef] px-2">
          HEIGHT: 74.16 MM
        </div>
        <div className="absolute -left-3 top-4 -rotate-90 origin-left text-[9px] font-mono tracking-widest text-black/40">
          GRID: 33°17&apos;25.9&quot;N
        </div>

        {/* Vector Traced Logo Lockup */}
        <div className="w-full max-w-[320px] aspect-[248/74] mb-6 flex items-center justify-center">
          <svg
            viewBox="0 0 248.16 74.16"
            className="w-full h-auto text-black transition-all duration-700"
            fill="currentColor"
          >
            <use href="/cvi-arch-logo.svg#cvi-arch-logo" />
          </svg>
        </div>

        {/* Studio Subtext */}
        <div className="text-[11px] font-mono tracking-[0.25em] uppercase text-black/70 mb-8 text-center">
          Architectural Tectonics • Baghdad Atelier
        </div>

        {/* Progress Metric & Bar */}
        <div className="w-full max-w-xs flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px] font-mono text-black/80">
            <span>COORDINATE MAPPING</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-[2px] bg-black/10 overflow-hidden relative">
            <div
              className="h-full bg-black transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Direct Skip Trigger */}
      <button
        onClick={() => {
          if (containerRef.current) {
            gsap.to(containerRef.current, {
              yPercent: -100,
              duration: 0.8,
              ease: 'power4.inOut',
              onComplete: () => {
                setIsDismissed(true);
                sessionStorage.setItem('cvi_preloader_seen', 'true');
                if (onComplete) onComplete();
              },
            });
          }
        }}
        className="absolute bottom-8 text-[10px] font-mono tracking-widest text-black/40 hover:text-black transition-colors uppercase cursor-pointer"
      >
        [ CLICK TO ENTER ATELIER ]
      </button>
    </div>
  );
}
