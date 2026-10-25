'use client';

import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  /** The letters shown in the middle (edited in Admin → Site content). */
  text?: string;
  onComplete?: () => void;
}

type Stage = 'centered' | 'spread' | 'slideUp' | 'done';

const EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';

/** Tells the page (the home hero) that the screen is leaving, so its own entrance can start. */
function announceIntro() {
  document.documentElement.dataset.intro = 'ready';
  window.dispatchEvent(new Event('cvi:intro'));
}

/**
 * Opening screen: the studio's cream drafting sheet with the letters C V I together in the
 * centre; after 1 s they spread apart; after 2 s the whole screen slides up and away.
 * It is part of the server-rendered page, so there is no flash of content first.
 * Every moving part is a transform, so the browser animates it on the GPU without re-layout.
 */
export function Preloader({ text = 'CVI', onComplete }: PreloaderProps) {
  const letters = Array.from(text.trim() || 'CVI');
  const [stage, setStage] = useState<Stage>('centered');

  useEffect(() => {
    // Respect reduced motion: no staged animation, just get out of the way.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('done');
      announceIntro();
      onComplete?.();
      return;
    }

    // Hold the page still while the screen is up.
    const body = document.body;
    const prev = { overflow: body.style.overflow, overscroll: body.style.overscrollBehavior };
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    const spread = window.setTimeout(() => setStage('spread'), 1000);
    const slide = window.setTimeout(() => {
      setStage('slideUp');
      announceIntro();
    }, 2000);
    const finish = window.setTimeout(() => {
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscroll;
      setStage('done');
      onComplete?.();
    }, 2850);

    return () => {
      window.clearTimeout(spread);
      window.clearTimeout(slide);
      window.clearTimeout(finish);
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscroll;
    };
  }, [onComplete]);

  if (stage === 'done') return null;

  const spreadOut = stage !== 'centered';
  const mid = (letters.length - 1) / 2;

  return (
    <div
      role="status"
      aria-label="Loading CVI Architects"
      className="fixed left-0 top-0 z-[10000] flex h-screen w-screen select-none items-center justify-center overflow-hidden bg-[#f5f3ef] text-[#111114]"
      style={{
        height: '100dvh',
        transition: `transform 0.85s ${EASE}`,
        transform: stage === 'slideUp' ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 0, 0)',
        pointerEvents: stage === 'slideUp' ? 'none' : 'auto',
        willChange: 'transform',
      }}
    >
      {/* Drafting-sheet crosshair guides */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black/10" />
        <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-black/10" />
      </div>

      <div
        className="relative flex flex-row font-semibold"
        style={{
          fontSize: 'clamp(32px, 3.2vw, 48px)',
          letterSpacing: 10,
          // letter-spacing leaves a trailing gap after the last letter; pull it back so the word is centred
          marginRight: -10,
        }}
      >
        {letters.map((letter, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translate3d(${spreadOut ? `calc(${(i - mid).toFixed(2)} * (30vw + 0.75em))` : '0px'}, 0, 0)`,
              transition: `transform 1s ${EASE}`,
              willChange: 'transform',
            }}
          >
            {letter === ' ' ? ' ' : letter}
          </span>
        ))}
      </div>
    </div>
  );
}
