'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface IntroHeroProps {
  eyebrow: string;
  title: string;
  titleMuted: string;
  body: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  scrollCue: string;
}

/**
 * First screen after the loader — a drafting sheet in the manner of illoca.unseen.co:
 * a fixed blueprint grid, a huge outlined headline that is "inked in" from left to right,
 * handwritten margin notes, and a cursor that carries crosshair lines and live X / Y readings.
 *
 * Everything animated is a transform or opacity (GPU-composited), the entrance waits for the
 * loader to leave (`cvi:intro`), and the scroll-out is scrubbed so it follows the smooth scroller.
 */
export function IntroHero({ eyebrow, title, titleMuted, body, primaryCta, primaryHref, secondaryCta, secondaryHref, scrollCue }: IntroHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);
  const lineXRef = useRef<HTMLDivElement>(null);
  const lineYRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const cleanups: Array<() => void> = [];

    if (reduce) return () => cleanups.forEach((fn) => fn());

    const ctx = gsap.context(() => {
      // Starting poses (the loader is covering the page, so nothing flashes)
      gsap.set(innerRef.current, { y: 70, opacity: 0 });
      gsap.set(fillRef.current, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(notesRef.current?.children ?? [], { opacity: 0, y: 14 });
      gsap.set(bottomRef.current, { opacity: 0, y: 28 });
      gsap.set([coordsRef.current, lineXRef.current, lineYRef.current], { opacity: 0 });

      let played = false;
      const play = () => {
        if (played) return;
        played = true;
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.to(innerRef.current, { y: 0, opacity: 1, duration: 1.6 }, 0.05)
          // ink fills the outlined letters left → right (a little past the edge for the italic overhang)
          .to(fillRef.current, { clipPath: 'inset(-4% -4% -4% -4%)', duration: 1.9, ease: 'power3.inOut' }, 0.3)
          .to(notesRef.current?.children ?? [], { opacity: 1, y: 0, duration: 1.1, stagger: 0.14 }, 1.0)
          .to(bottomRef.current, { opacity: 1, y: 0, duration: 1.3 }, 0.85)
          .to([coordsRef.current, lineXRef.current, lineYRef.current], { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.2)
          .set(fillRef.current, { clearProps: 'clipPath' });
      };

      if (document.documentElement.dataset.intro === 'ready') play();
      else window.addEventListener('cvi:intro', play, { once: true });
      // Safety net if the loader never reports in.
      const fallback = window.setTimeout(play, 6000);
      cleanups.push(() => {
        window.removeEventListener('cvi:intro', play);
        window.clearTimeout(fallback);
      });

      // Scroll-out: the headline drifts up slower than the page and dissolves into the dark section.
      gsap.to(stageRef.current, {
        yPercent: -14,
        scale: 0.96,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top+=20%', scrub: true },
      });
      gsap.to(bottomRef.current, {
        yPercent: -30,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: '60% top', scrub: true },
      });
    }, root);
    cleanups.push(() => ctx.revert());

    // Cursor crosshair + X / Y readout (grid units), eased so it glides instead of snapping.
    if (finePointer) {
      let tx = window.innerWidth / 2;
      let ty = window.innerHeight / 2;
      let cx = tx;
      let cy = ty;
      const onMove = (e: PointerEvent) => {
        tx = e.clientX;
        ty = e.clientY;
      };
      const tick = () => {
        if (window.scrollY > window.innerHeight) return;
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        if (lineXRef.current) lineXRef.current.style.transform = `translate3d(${cx.toFixed(1)}px,0,0)`;
        if (lineYRef.current) lineYRef.current.style.transform = `translate3d(0,${(cy + window.scrollY).toFixed(1)}px,0)`;
        if (xRef.current) xRef.current.textContent = (cx / 16).toFixed(2);
        if (yRef.current) yRef.current.textContent = ((cy + window.scrollY) / 16).toFixed(2);
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      gsap.ticker.add(tick);
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove);
        gsap.ticker.remove(tick);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const lines = (
    <>
      <span className="block">{title}</span>
      {titleMuted && <span className="intro-muted block">{titleMuted}</span>}
    </>
  );

  return (
    <section
      ref={rootRef}
      aria-label="Introduction"
      className="relative isolate h-[100svh] min-h-[38rem] w-full overflow-hidden text-[#1b1b1f]"
    >
      {/* Cursor crosshair */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden [@media(hover:hover)_and_(pointer:fine)]:block">
        <div ref={lineXRef} className="absolute bottom-0 left-0 top-0 w-px bg-[#1b1b1f]/15" />
        <div ref={lineYRef} className="absolute left-0 right-0 top-0 h-px bg-[#1b1b1f]/15" />
      </div>

      {/* Coordinates */}
      <div
        ref={coordsRef}
        aria-hidden="true"
        className="absolute left-8 top-28 hidden text-[13px] leading-5 tabular-nums text-[#6d675b] [@media(hover:hover)_and_(pointer:fine)]:block"
      >
        <div>
          <span className="text-[#1b1b1f]/50">X</span> <span ref={xRef}>0.00</span>
        </div>
        <div>
          <span className="text-[#1b1b1f]/50">Y</span> <span ref={yRef}>0.00</span>
        </div>
      </div>

      {/* Headline */}
      <div ref={stageRef} className="absolute inset-0 flex items-center justify-center px-5 will-change-transform sm:px-10">
        <h1 className="relative mx-auto w-full max-w-[84rem]">
          <span className="sr-only">
            {title} {titleMuted}
          </span>
          <div ref={innerRef} aria-hidden="true" className="relative will-change-transform">
            <span className="intro-title intro-title-outline block">{lines}</span>
            <span ref={fillRef} className="intro-title intro-title-fill absolute inset-0 block will-change-[clip-path]">
              {lines}
            </span>
          </div>

          <div ref={notesRef} aria-hidden="true">
            {eyebrow && (
              <span className="hand-note absolute -top-9 left-1 -rotate-3 text-[1.45rem] sm:-top-10 sm:text-[1.8rem]">{eyebrow}</span>
            )}
            {scrollCue && (
              <span className="hand-note absolute -bottom-10 right-1 inline-flex -rotate-2 items-center gap-2 text-[1.45rem] sm:-bottom-12 sm:text-[1.8rem]">
                <ArrowDown className="h-5 w-5" strokeWidth={1.5} />
                {scrollCue}
              </span>
            )}
          </div>
        </h1>
      </div>

      {/* Lead-in + calls to action */}
      <div ref={bottomRef} className="absolute inset-x-0 bottom-24 px-6 sm:px-10">
        <div className="mx-auto flex max-w-[112.5rem] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="order-2 flex flex-wrap items-center gap-x-6 gap-y-3 sm:order-1">
            <Link
              href={primaryHref || '/projects'}
              className="inline-flex items-center gap-3 rounded-full bg-[#1b1b1f] px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#f5f3ef] transition-colors duration-300 hover:bg-[#283f7d]"
            >
              <span>{primaryCta}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {secondaryCta && (
              <Link
                href={secondaryHref || '/about'}
                className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1b1b1f] underline decoration-[#1b1b1f]/30 underline-offset-[6px] transition-colors hover:decoration-[#1b1b1f]"
              >
                {secondaryCta}
              </Link>
            )}
          </div>
          {body && (
            <p className="order-1 line-clamp-3 max-w-[24rem] text-[15px] font-medium leading-relaxed text-[#4a463d] sm:order-2 sm:text-right">
              {body}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
