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
export function BlueprintSheet({ children }: { children: React.ReactNode }) {
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
    </div>
  );
}
