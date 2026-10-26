'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface LetterSectionProps {
  eyebrow: string;
  title: string;
  /** Paragraphs separated by a blank line. */
  body: string;
  sign: string;
}

/**
 * A letter on a sheet of ruled paper held by two strips of tape. As the sheet scrolls through the
 * screen its words darken one after another (like reading along with a pencil), and the signature's
 * underline is drawn last. Reduced motion shows the finished letter.
 */
export function LetterSection({ eyebrow, title, body, sign }: LetterSectionProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  useIsoLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('[data-word]', paper);
      gsap.set(words, { opacity: 0.2 });
      gsap.set(lineRef.current, { strokeDashoffset: 1 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: paper, start: 'top 72%', end: 'bottom 62%', scrub: 0.5 },
      });
      tl.to(words, { opacity: 1, stagger: { each: 1 / Math.max(words.length, 1), from: 'start' }, duration: 1 }, 0);
      tl.to(lineRef.current, { strokeDashoffset: 0, duration: 0.25, ease: 'power1.out' }, '>-0.05');
    }, paper);
    return () => ctx.revert();
  }, [body]);

  return (
    <section className="mx-auto w-full max-w-[112.5rem] px-6 py-16 sm:px-10 sm:py-32">
      <div className="relative mx-auto max-w-[46rem]">
        {/* two strips of tape */}
        <span aria-hidden="true" className="absolute -top-4 left-8 z-10 h-8 w-24 -rotate-6 bg-[#e8dcc0]/80 shadow-sm sm:left-12" />
        <span aria-hidden="true" className="absolute -top-4 right-8 z-10 h-8 w-24 rotate-[5deg] bg-[#e8dcc0]/80 shadow-sm sm:right-12" />

        <div
          ref={paperRef}
          className="letter-paper relative -rotate-[0.6deg] border border-[#424242]/25 px-7 pb-12 pt-14 shadow-[4px_4px_0_rgba(0,0,0,0.08)] sm:px-14 sm:pb-16 sm:pt-20"
        >
          <div className="hand-note -rotate-2 text-[15px] sm:text-[18px]">{eyebrow}</div>
          <h2 className="feature-title mt-4 !text-[clamp(2rem,4.4vw,3.8rem)] text-[#1b1b1f]">{title}</h2>

          <div className="mt-8 space-y-5 text-[17px] font-medium leading-[1.75] text-[#2e2b26] sm:text-[19px]">
            {paragraphs.map((p, i) => (
              <p key={i}>
                {p.split(/(\s+)/).map((part, k) =>
                  /^\s+$/.test(part) ? (
                    part
                  ) : (
                    <span key={k} data-word="">
                      {part}
                    </span>
                  ),
                )}
              </p>
            ))}
          </div>

          <div className="mt-10 inline-block">
            <div className="hand-note text-[18px] text-[#283f7d] sm:text-[22px]">{sign}</div>
            <svg viewBox="0 0 220 14" className="mt-1 h-3.5 w-full overflow-visible" fill="none" aria-hidden="true">
              <path ref={lineRef} d="M2 9 C 30 2, 60 13, 100 7 S 170 3, 218 8" pathLength={1} stroke="#283f7d" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 2" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
