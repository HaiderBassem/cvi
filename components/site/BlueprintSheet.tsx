'use client';

import React, { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger);

/**
 * The cream drafting sheet that holds the intro and the drawing scene. One continuous grid
 * runs behind both, and while any part of it sits under the header the header switches to
 * dark ink (`html[data-header-tone="light"]`, styled in globals.css).
 */
export function BlueprintSheet({ children, fadeTop = false, fadeBottom = true }: { children: React.ReactNode; fadeTop?: boolean; fadeBottom?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top+=64',
      end: 'bottom top+=64',
      onToggle: (self) => {
        if (self.isActive) root.dataset.headerTone = 'light';
        else delete root.dataset.headerTone;
      },
    });
    if (trigger.isActive) root.dataset.headerTone = 'light';
    return () => {
      trigger.kill();
      delete root.dataset.headerTone;
    };
  }, []);

  return (
    <div ref={ref} className="blueprint-grid relative">
      {children}
      {/* the sheet melts into the dark page around it */}
      {fadeTop && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-[#0a0a0c] to-transparent sm:h-32" />
      )}
      {fadeBottom && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-b from-transparent to-[#0a0a0c] sm:h-32" />
      )}
    </div>
  );
}
