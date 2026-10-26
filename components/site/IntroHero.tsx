'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight, ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface IntroImage {
  src: string;
  alt: string;
}

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
  /** Pictures shown in the window under the headline, slowly cross-fading. */
  images: IntroImage[];
  email: string;
}

/** Top of the picture window once it has risen, and the gap kept under the headline's notes. */
const WINDOW_TOP = 84;
const NOTES_GAP = 64;

/**
 * First screen after the loader, built after illoca.unseen.co: a cream grid sheet with a huge
 * outlined headline that is inked in left to right, handwritten caps notes, X / Y readings that
 * follow the cursor, and a framed picture window under the headline. The section is pinned; as you
 * scroll, the window rises over the headline until it fills the sheet (the grid stays as its frame).
 *
 * Everything animated is a transform, opacity or clip, the entrance waits for the loader to
 * leave (`cvi:intro`), and the scroll part is one scrubbed timeline so it follows the smooth scroller.
 */
export function IntroHero({ eyebrow, title, titleMuted, body, primaryCta, primaryHref, secondaryCta, secondaryHref, scrollCue, images, email }: IntroHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const picsRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);
  const lineXRef = useRef<HTMLDivElement>(null);
  const lineYRef = useRef<HTMLDivElement>(null);

  const shown = images.slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shown.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % shown.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [shown.length]);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      // Where the picture window starts: just under the headline and its notes
      const startY = () => {
        const stage = stageRef.current;
        const head = headRef.current;
        if (!stage || !head) return 240;
        return Math.max(0, stage.offsetTop + head.offsetTop + head.offsetHeight + NOTES_GAP - WINDOW_TOP);
      };

      // Starting poses (the loader is covering the page, so nothing flashes)
      gsap.set(innerRef.current, { y: 70, opacity: 0 });
      gsap.set(fillRef.current, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(notesRef.current?.children ?? [], { opacity: 0, y: 14 });
      gsap.set(winRef.current, { opacity: 0, y: 90 });
      gsap.set([coordsRef.current, lineXRef.current, lineYRef.current], { opacity: 0 });

      let played = false;
      const play = () => {
        if (played) return;
        played = true;
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.to(innerRef.current, { y: 0, opacity: 1, duration: 1.6 }, 0.05)
          // ink fills the outlined letters left → right (a little past the edge for the overhang)
          .to(fillRef.current, { clipPath: 'inset(-6% -6% -6% -6%)', duration: 1.9, ease: 'power3.inOut' }, 0.3)
          .to(notesRef.current?.children ?? [], { opacity: 1, y: 0, duration: 1.1, stagger: 0.14 }, 1.0)
          .to(winRef.current, { opacity: 1, y: 0, duration: 1.8 }, 0.45)
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

      // Scroll: the window rises over the headline until it fills the sheet, the picture drifts closer
      const scroll = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
      });
      scroll
        .fromTo(clipRef.current, { clipPath: () => `inset(${startY()}px 0px 0px 0px)` }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.62, ease: 'power2.inOut' }, 0)
        .to(stageRef.current, { yPercent: -26, opacity: 0, duration: 0.5, ease: 'power1.in' }, 0)
        .fromTo(picsRef.current, { scale: 1 }, { scale: 1.12, duration: 1 }, 0)
        .set({}, {}, 1);
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
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        if (lineXRef.current) lineXRef.current.style.transform = `translate3d(${cx.toFixed(1)}px,0,0)`;
        if (lineYRef.current) lineYRef.current.style.transform = `translate3d(0,${cy.toFixed(1)}px,0)`;
        if (xRef.current) xRef.current.textContent = (cx / 16).toFixed(2);
        if (yRef.current) yRef.current.textContent = (cy / 16).toFixed(2);
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
      {titleMuted && <span className="block">{titleMuted}</span>}
    </>
  );

  return (
    <section ref={rootRef} aria-label="Introduction" className="intro-sheet relative isolate text-[#1b1b1f]">
      <div className="sticky top-0 h-[100svh] min-h-[30rem] overflow-hidden motion-reduce:static motion-reduce:flex motion-reduce:h-auto motion-reduce:min-h-[100svh] motion-reduce:flex-col">
        {/* Cursor crosshair */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] hidden [@media(hover:hover)_and_(pointer:fine)]:block motion-reduce:hidden">
          <div ref={lineXRef} className="absolute bottom-0 left-0 top-0 w-px bg-[#1b1b1f]/15" />
          <div ref={lineYRef} className="absolute left-0 right-0 top-0 h-px bg-[#1b1b1f]/15" />
        </div>

        {/* Coordinates (left) and email (right), in handwritten caps */}
        <div
          ref={coordsRef}
          aria-hidden="true"
          className="hand-note absolute left-6 top-9 z-[2] hidden text-[13px] leading-[1.25] tabular-nums sm:left-8 lg:block"
        >
          <div>
            <span className="text-[#1b1b1f]/45">X</span> <span ref={xRef}>0.00</span>
          </div>
          <div>
            <span className="text-[#1b1b1f]/45">Y</span> <span ref={yRef}>0.00</span>
          </div>
        </div>
        {email && (
          <a href={`mailto:${email}`} className="hand-note absolute right-6 top-8 z-[2] hidden text-[16px] text-[#5b5b5b] transition-colors hover:text-[#283f7d] sm:right-8 lg:block">
            {email}
          </a>
        )}

        {/* Headline */}
        <div ref={stageRef} className="absolute inset-x-0 top-[clamp(7.5rem,14svh,9.5rem)] z-[2] px-5 will-change-transform sm:px-10 motion-reduce:static motion-reduce:pt-28">
          <h1 ref={headRef} className="relative mx-auto w-full max-w-[84rem]">
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
                <span className="hand-note absolute -top-7 left-1 -rotate-3 text-[15px] sm:-top-8 sm:text-[19px] lg:left-3">
                  {eyebrow}
                  <svg viewBox="0 0 120 8" className="mt-1 block h-2 w-full" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M2 5 C 20 1, 40 7, 60 4 S 100 2, 118 5" />
                  </svg>
                </span>
              )}
              {scrollCue && (
                <span className="hand-note absolute -bottom-9 right-1 inline-flex -rotate-2 items-center gap-2 text-[15px] sm:-bottom-10 sm:text-[19px]">
                  <ArrowDown className="h-4 w-4 -rotate-45" strokeWidth={1.5} />
                  {scrollCue}
                </span>
              )}
            </div>
          </h1>
        </div>

        {/* The picture window: it rises over the headline as you scroll */}
        <div
          ref={winRef}
          className="absolute inset-x-4 bottom-4 top-[5.25rem] z-[3] sm:inset-x-6 motion-reduce:relative motion-reduce:inset-x-4 motion-reduce:top-auto motion-reduce:mx-4 motion-reduce:mt-16 motion-reduce:h-[70svh] motion-reduce:flex-none"
        >
          <div ref={clipRef} className="intro-window relative h-full w-full overflow-hidden bg-[#283f7d]">
            <div ref={picsRef} className="absolute inset-0 will-change-transform">
              {shown.map((img, i) => (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={i === index ? img.alt : ''}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={`object-cover transition-opacity duration-[1600ms] ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start justify-between gap-5 p-5 sm:p-7 md:flex-row md:items-end">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href={primaryHref || '/projects'}
                  className="group inline-flex h-12 overflow-hidden rounded-lg shadow-[2px_2px_2px_rgba(0,0,0,0.15)]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-l-lg border border-[#a19d94] bg-white text-[#283f7d] transition-colors duration-300 group-hover:bg-[#283f7d] group-hover:text-white">
                    <ArrowUpRight className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="flex h-12 items-center rounded-r-lg border-y border-r border-[#a19d94] bg-[#fdf8f0] px-6 text-[14px] font-medium text-[#212121]">
                    {primaryCta}
                  </span>
                </Link>
                {secondaryCta && (
                  <Link
                    href={secondaryHref || '/about'}
                    className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white underline decoration-white/40 underline-offset-[6px] transition-colors hover:decoration-white"
                  >
                    {secondaryCta}
                  </Link>
                )}
              </div>
              {body && (
                <p className="hidden max-w-[24rem] items-center gap-3 text-right text-[15px] font-medium leading-snug text-[#e0d7c5] md:flex">
                  <span className="line-clamp-2">{body}</span>
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#e76051] text-white">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
