'use client';

import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  /** The letters shown in the middle (edited in Admin → Site content). */
  text?: string;
  /** Background picture. */
  image?: string;
  onComplete?: () => void;
}

type Stage = 'centered' | 'spread' | 'slideUp' | 'done';


/**
 * Opening screen, matching the studio's main site: the dark map of Baghdad with the letters
 * C V I together in the centre; after 1 s they spread apart; after 2 s the whole screen slides
 * up and away. It is part of the server-rendered page, so there is no flash of content first.
 */
export function Preloader({ text = 'CVI', image = '/brand/loader-map.jpg', onComplete }: PreloaderProps) {
  const letters = Array.from(text.trim() || 'CVI');
  const [stage, setStage] = useState<Stage>('centered');

  useEffect(() => {
    // Respect reduced motion: no staged animation, just get out of the way.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('done');
      onComplete?.();
      return;
    }

    // Hold the page still while the screen is up.
    const body = document.body;
    const prev = { overflow: body.style.overflow, overscroll: body.style.overscrollBehavior };
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    const spread = window.setTimeout(() => setStage('spread'), 1000);
    const slide = window.setTimeout(() => setStage('slideUp'), 2000);
    const finish = window.setTimeout(() => {
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscroll;
      setStage('done');
      onComplete?.();
    }, 2800);

    return () => {
      window.clearTimeout(spread);
      window.clearTimeout(slide);
      window.clearTimeout(finish);
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscroll;
    };
  }, [onComplete]);

  if (stage === 'done') return null;

  return (
    <div
      role="status"
      aria-label="Loading CVI Architects"
      className="fixed left-0 top-0 z-[10000] flex h-screen w-screen select-none items-center justify-center bg-[#222] bg-cover bg-center"
      style={{
        backgroundImage: `url('${image.replace(/'/g, '%27')}')`,
        transition: 'transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)',
        transform: stage === 'slideUp' ? 'translateY(-100vh)' : 'translateY(0)',
        pointerEvents: stage === 'slideUp' ? 'none' : 'auto',
      }}
    >
      <div
        className="flex flex-row font-semibold text-white"
        style={{
          gap: stage === 'centered' ? 0 : '30vw',
          transition: 'gap 1s cubic-bezier(0.77, 0, 0.175, 1)',
          fontSize: 'clamp(32px, 3.2vw, 48px)',
          letterSpacing: 10,
        }}
      >
        {letters.map((letter, i) => (
          <span key={i}>{letter === ' ' ? '\u00a0' : letter}</span>
        ))}
      </div>
    </div>
  );
}
