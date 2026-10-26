'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown } from 'lucide-react';
import { FEATURE_ART, FEATURE_ART_ALT } from '@/components/site/featureArt';
import { PaperButton } from '@/components/site/PaperButton';

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface Feature {
  note: string;
  title: string;
  text: string;
}

interface FeatureScrollProps {
  features: Feature[];
  cta: string;
  ctaHref: string;
  hint: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The process scroll, after illoca.unseen.co: one pinned stage, five features that take turns as
 * you scroll. Each has a numbered handwritten tag, an outlined headline that is inked in left to
 * right, a line of text, a button, and its own architectural drawing that is drawn stroke by stroke.
 * Text and drawing swap sides from one feature to the next. A single scrubbed timeline drives it all,
 * and everything animated is a transform, an opacity, a clip or a dash offset.
 */
export function FeatureScroll({ features, cta, ctaHref, hint }: FeatureScrollProps) {
  const rootRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const count = features.length;

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || count === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // everything stays finished

    const ctx = gsap.context(() => {
      const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
      const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

      slides.forEach((slide, i) => {
        const q = gsap.utils.selector(slide);
        const t0 = i;

        // The slide arrives and leaves (the first is already there, the last stays)
        if (i > 0) master.fromTo(slide, { autoAlpha: 0, y: 56 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power2.out' }, t0);
        if (i < slides.length - 1) master.to(slide, { autoAlpha: 0, y: -56, duration: 0.12, ease: 'power2.in' }, t0 + 0.88);

        // Headline ink fills the outline left → right
        master.fromTo(q('[data-fill]'), { clipPath: 'inset(-6% 100% -6% -6%)' }, { clipPath: 'inset(-6% -6% -6% -6%)', duration: 0.34 }, t0 + 0.06);
        master.fromTo(q('[data-in]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.14, stagger: 0.07, ease: 'power2.out' }, t0 + 0.06);

        // The drawing: strokes one after another, fills as each outline closes, notes at the end
        const strokes = Array.from(slide.querySelectorAll<SVGPathElement>('path[data-stroke]'));
        const weights = strokes.map((p) => Number(p.getAttribute('data-w')) || 1);
        const gap = 0.12;
        const unit = 0.5 / (weights.reduce((a, b) => a + b, 0) + gap * Math.max(0, strokes.length - 1));
        let at = t0 + 0.1;
        strokes.forEach((p, k) => {
          const dur = weights[k] * unit;
          master.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur }, at);
          if (p.hasAttribute('data-fill')) {
            master.fromTo(p, { attr: { 'fill-opacity': 0 } }, { attr: { 'fill-opacity': 1 }, duration: 0.06 }, at + dur);
          }
          at += dur + gap * unit;
        });
        master.fromTo(q('[data-fade]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, ease: 'power1.out' }, Math.max(at, t0 + 0.56));
      });
      master.set({}, {}, count); // pad so the timeline is exactly one unit per feature

      let active = -1;
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        animation: master,
        onUpdate: (self) => {
          const idx = Math.min(count - 1, Math.floor(self.progress * count));
          if (idx !== active) {
            active = idx;
            slides.forEach((el, i) => el.setAttribute('data-active', String(i === idx)));
            if (counterRef.current) counterRef.current.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
          }
          if (barRef.current) barRef.current.style.transform = `scaleX(${clamp01(self.progress).toFixed(4)})`;
        },
      });
    }, root);

    return () => ctx.revert();
  }, [count]);

  if (count === 0) return null;
  const Slides = features.map((f, i) => {
    const Art = FEATURE_ART[i % FEATURE_ART.length];
    const textRight = i % 2 === 1;
    return (
      <div
        key={i}
        data-slide=""
        data-active={i === 0 ? 'true' : 'false'}
        className="feature-slide grid w-full items-center gap-5 [grid-area:1/1] lg:grid-cols-12 lg:gap-10 motion-reduce:[grid-area:auto]"
      >
        {/* Words */}
        <div className={`relative z-10 order-2 text-center lg:order-none lg:row-start-1 lg:text-left ${textRight ? 'lg:col-span-5 lg:col-start-8' : 'lg:col-span-5 lg:col-start-1'}`}>
          <div data-in="" className="hand-note mx-auto inline-flex -rotate-2 items-baseline gap-3 lg:mx-0">
            <span className="text-[2rem] leading-none text-[#283f7d] sm:text-[2.6rem]">{i + 1}</span>
            <span className="text-[15px] sm:text-[18px]">{f.note}</span>
          </div>

          <h2 className="relative mt-3 w-full">
            <span className="sr-only">{f.title}</span>
            <span aria-hidden="true" className="feature-title intro-title-outline relative block">
              {f.title}
            </span>
            <span data-fill="" aria-hidden="true" className="feature-title intro-title-fill absolute inset-0 block will-change-[clip-path]">
              {f.title}
            </span>
          </h2>

          <p data-in="" className="mx-auto mt-5 max-w-[26rem] text-[15px] font-medium leading-relaxed text-[#4a463d] sm:text-[17px] lg:mx-0">
            {f.text}
          </p>

          <div data-in="" className="mt-6 flex justify-center lg:mt-8 lg:justify-start">
            <PaperButton href={ctaHref || '/projects'}>{cta}</PaperButton>
          </div>

          {i === 0 && hint && (
            <div data-in="" className="hand-note mt-6 hidden items-center gap-2 text-[15px] lg:inline-flex">
              <ArrowDown className="h-5 w-5 rotate-45" strokeWidth={1.5} aria-hidden="true" />
              {hint}
            </div>
          )}
        </div>

        {/* The drawing */}
        <div className={`relative order-1 lg:order-none lg:row-start-1 ${textRight ? 'lg:col-span-7 lg:col-start-1' : 'lg:col-span-7 lg:col-start-6'}`}>
          <svg
            viewBox="0 0 640 520"
            role="img"
            aria-label={FEATURE_ART_ALT[i % FEATURE_ART_ALT.length]}
            className="mx-auto block h-auto max-h-[36svh] w-full overflow-visible lg:max-h-[74svh]"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Art />
          </svg>
        </div>
      </div>
    );
  });

  return (
    <section
      ref={rootRef}
      aria-label={features.map((f) => f.title).join(', ')}
      className="feature-scroll relative"
      style={{ '--features': count } as React.CSSProperties}
    >
      <div className="sticky top-0 flex h-[100svh] min-h-[34rem] items-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:py-20">
        <div className="mx-auto grid w-full max-w-[112.5rem] gap-24 px-6 pt-20 sm:px-10 lg:pt-10">{Slides}</div>

        {/* Progress */}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-6 flex items-center gap-4 text-[13px] tabular-nums text-[#6d675b] motion-reduce:hidden sm:left-10">
          <span ref={counterRef}>{`01 / ${String(count).padStart(2, '0')}`}</span>
          <span className="relative block h-px w-24 bg-[#1b1b1f]/15 sm:w-40">
            <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-[#283f7d]" />
          </span>
        </div>
      </div>
    </section>
  );
}
