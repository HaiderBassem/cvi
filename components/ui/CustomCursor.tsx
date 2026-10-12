'use client';

import React, { useEffect, useState, useRef } from 'react';

export function CustomCursor() {
  const [cursorText, setCursorText] = useState('');
  const [cursorVariant, setCursorVariant] = useState<'default' | 'view' | 'drag' | 'play' | 'pointer' | 'none'>('default');
  const [isVisible, setIsVisible] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMouseMove = (e: MouseEvent) => {
      pos.current.targetX = e.clientX;
      pos.current.targetY = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Check hovered element
      const target = e.target as HTMLElement | null;
      // 3D viewers keep the native grab cursor; the blended dot would turn orange over sky-blue scenes.
      if (target?.closest('[data-cursor="none"]')) {
        setCursorVariant('none');
        setCursorText('');
        return;
      }
      const interactiveEl = target?.closest('[data-cursor], a, button, input, textarea');

      if (interactiveEl) {
        const customType = interactiveEl.getAttribute('data-cursor');
        if (customType === 'view') {
          setCursorVariant('view');
          setCursorText('VIEW');
        } else if (customType === 'drag') {
          setCursorVariant('drag');
          setCursorText('DRAG');
        } else if (customType === 'play') {
          setCursorVariant('play');
          setCursorText('PLAY');
        } else {
          setCursorVariant('pointer');
          setCursorText('');
        }
      } else {
        setCursorVariant('default');
        setCursorText('');
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    // Smooth lerp loop
    const loop = () => {
      pos.current.x += (pos.current.targetX - pos.current.x) * 0.18;
      pos.current.y += (pos.current.targetY - pos.current.y) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (!isVisible || cursorVariant === 'none') return null;

  const isExpanded = cursorVariant === 'view' || cursorVariant === 'drag' || cursorVariant === 'play';

  return (
    <div
      ref={dotRef}
      className={`custom-cursor fixed z-[99999] pointer-events-none flex items-center justify-center transition-all duration-200 ${
        isExpanded
          ? 'w-20 h-20 rounded-full bg-white text-black text-[11px] font-mono tracking-widest font-semibold backdrop-blur-md shadow-2xl scale-100'
          : cursorVariant === 'pointer'
          ? 'w-10 h-10 rounded-full border border-white/60 bg-white/10 backdrop-blur-sm'
          : 'w-3 h-3 rounded-full bg-white mix-blend-difference'
      }`}
    >
      {cursorText && <span className="animate-pulse">{cursorText}</span>}
    </div>
  );
}
