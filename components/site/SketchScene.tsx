'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SketchHandPhoto } from '@/components/site/SketchHandPhoto';

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const INK = '#1b1b1f';
const BLUE = '#283f7d';

export interface SketchStep {
  title: string;
  text: string;
}

interface SketchSceneProps {
  eyebrow: string;
  title: string;
  note: string;
  steps: [SketchStep, SketchStep, SketchStep];
}

/* ------------------------------------------------------------------------------------------
 * The drawing: an elevation of an arched podium with a tower, in the studio's own language.
 * Each stroke is one SVG path, drawn in order; the hand follows the live end of the line.
 * ---------------------------------------------------------------------------------------- */

type Tone = 'ink' | 'blue' | 'faint' | 'hatch';

interface Stroke {
  d: string;
  /** Relative time the stroke takes to draw. */
  weight: number;
  tone: Tone;
  /** Which caption is lit while this stroke is being drawn (0, 1 or 2). */
  step: 0 | 1 | 2;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const BAYS = range(5).map((i) => 200 + 128 * i); // left edge of each arch opening
const SLABS = [202, 254, 306, 358];

const STROKES: Stroke[] = [
  // 1 — the idea: construction lines, ground, podium
  { step: 0, tone: 'faint', weight: 0.9, d: 'M500 14 V606 M60 410 H940 M60 150 H940 M390 100 V560 M610 100 V560' },
  { step: 0, tone: 'ink', weight: 0.7, d: 'M70 560 H930' },
  { step: 0, tone: 'hatch', weight: 0.7, d: range(61).map((i) => `M${84 + i * 14} 560 l-9 11`).join(' ') },
  { step: 0, tone: 'ink', weight: 0.9, d: 'M180 560 V410 H820 V560' },
  { step: 0, tone: 'ink', weight: 0.7, d: 'M180 560 V478 H96 V560 M820 560 V478 H904 V560' },

  // 2 — the structure: arcade, tower, floors, fins, crown
  { step: 1, tone: 'ink', weight: 1.5, d: BAYS.map((x) => `M${x} 560 V492 A44 44 0 0 1 ${x + 88} 492 V560`).join(' ') },
  { step: 1, tone: 'ink', weight: 1.1, d: 'M390 410 V150 H610 V410' },
  { step: 1, tone: 'ink', weight: 0.7, d: SLABS.map((y) => `M390 ${y} H610`).join(' ') },
  {
    step: 1,
    tone: 'ink',
    weight: 1.4,
    d: range(5)
      .flatMap((k) => range(5).map((j) => `M${(390 + (220 * (j + 1)) / 6).toFixed(1)} ${150 + 52 * k} v52`))
      .join(' '),
  },
  { step: 1, tone: 'ink', weight: 1.0, d: 'M410 150 V120 H590 V150 M440 120 A60 60 0 0 1 560 120 M500 60 V22 M492 22 H508' },

  // 3 — the detail: railings, windows, shade, people, dimensions
  {
    step: 2,
    tone: 'ink',
    weight: 0.8,
    d: `M180 398 H386 M614 398 H820 ${range(13).map((i) => `M${188 + i * 16} 410 V398`).join(' ')} ${range(13)
      .map((i) => `M${622 + i * 16} 410 V398`)
      .join(' ')}`,
  },
  { step: 2, tone: 'ink', weight: 0.6, d: 'M106 498 h24 v28 h-24 Z M142 498 h24 v28 h-24 Z M830 498 h24 v28 h-24 Z M866 498 h24 v28 h-24 Z' },
  {
    step: 2,
    tone: 'hatch',
    weight: 1.1,
    d: range(31)
      .map((i) => ({ top: 150 + i * 8.4 }))
      .filter(({ top }) => top + 36.7 <= 410)
      .map(({ top }) => `M573.3 ${(top + 36.7).toFixed(1)} L610 ${top.toFixed(1)}`)
      .join(' '),
  },
  {
    step: 2,
    tone: 'ink',
    weight: 0.8,
    d: [244, 372, 628]
      .map((x) => `M${x - 4.5} 522 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0 M${x} 527 V545 M${x} 545 L${x - 5} 560 M${x} 545 L${x + 5} 560 M${x - 8} 535 L${x} 530 L${x + 8} 535`)
      .join(' '),
  },
  { step: 2, tone: 'blue', weight: 0.6, d: 'M956 560 V24 M946 560 H966 M946 24 H966 M951 565 L961 555 M951 29 L961 19' },
  { step: 2, tone: 'blue', weight: 0.6, d: 'M96 594 H904 M96 584 V604 M904 584 V604 M91 599 L101 589 M899 599 L909 589' },
];

const TONES: Record<Tone, { stroke: string; width: number; opacity: number }> = {
  ink: { stroke: INK, width: 2.2, opacity: 1 },
  blue: { stroke: BLUE, width: 1.7, opacity: 1 },
  faint: { stroke: BLUE, width: 1.1, opacity: 0.4 },
  hatch: { stroke: INK, width: 1.1, opacity: 0.55 },
};

/** Where the pencil waits before it starts and where it goes when the drawing is finished (drawing units). */
const AWAY_START = { x: 1180, y: 760 };
const AWAY_END = { x: 1240, y: 340 };
/** Extra scale for the whole hand. */
const HAND_SCALE = 1; // the photo hand carries its own scale (see SketchHandPhoto)
const GAP = 0.12; // pen lifted between strokes
const HOLD = 1.3; // time left at the end for the hand to leave

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Scroll-driven drawing board. The section is tall and its content sticks to the screen; scroll
 * progress runs a timeline that draws the building stroke by stroke while an architect's hand
 * holds a pencil at the end of the line. Everything is transforms, opacity and dash offsets.
 */
export function SketchScene({ eyebrow, title, note, steps }: SketchSceneProps) {
  const rootRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const handRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const hand = handRef.current;
    const labels = labelsRef.current;
    if (!root || !svg || !hand || !labels) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // stays fully drawn

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-stroke]'));
    const items = Array.from(listRef.current?.children ?? []) as HTMLElement[];
    const lengths = paths.map((p) => p.getTotalLength());

    const proxy = { p: 0 };
    const tweens: gsap.core.Tween[] = [];
    const stepStart: number[] = [];

    const ctx = gsap.context(() => {
      gsap.set(paths, { strokeDashoffset: 1 });
      gsap.set(labels, { opacity: 0 });

      const tl = gsap.timeline({ paused: true });
      let t = 0;
      paths.forEach((path, i) => {
        const s = STROKES[i];
        if (stepStart[s.step] === undefined) stepStart[s.step] = t;
        const tw = gsap.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: s.weight, ease: 'none' });
        tweens.push(tw);
        tl.add(tw, t);
        t += s.weight + GAP;
      });
      tl.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power1.out' }, t - 0.4);
      const drawEnd = t + 0.3;
      tl.set({}, {}, drawEnd + HOLD); // pad the timeline so the hand has time to leave

      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
      });

      // Pencil state
      const first = paths[0].getPointAtLength(0);
      let target = { x: first.x, y: first.y };
      const cur = { x: AWAY_START.x, y: AWAY_START.y };
      let lastStep = -1;

      const tick = (_time: number, deltaMs: number) => {
        const p = proxy.p;
        tl.progress(p);
        const time = tl.time();

        // Which stroke is being drawn right now
        let active = -1;
        for (let i = 0; i < tweens.length; i++) {
          const pr = tweens[i].progress();
          if (pr > 0 && pr < 1) active = i;
        }
        let drawing = false;
        if (active >= 0) {
          const pt = paths[active].getPointAtLength(tweens[active].progress() * lengths[active]);
          target = { x: pt.x, y: pt.y };
          drawing = true;
        }
        const finished = time >= drawEnd;
        const notStarted = time <= 0.001;
        const aim = finished ? AWAY_END : notStarted ? AWAY_START : target;

        // Glide toward the aim point (frame-rate independent), with a tiny hand tremor while drawing
        const k = 1 - Math.exp((-deltaMs / 1000) * (drawing ? 18 : 6));
        cur.x += (aim.x - cur.x) * k;
        cur.y += (aim.y - cur.y) * k;
        const wob = drawing ? Math.sin(performance.now() / 55) * 0.5 : 0;
        const tilt = drawing ? Math.sin(performance.now() / 140) * 0.7 : 0;
        hand.setAttribute('transform', `translate(${(cur.x + wob).toFixed(2)} ${(cur.y + wob * 0.6).toFixed(2)}) rotate(${tilt.toFixed(2)}) scale(${HAND_SCALE})`);
        hand.setAttribute('opacity', String(clamp01(time / 0.6) * clamp01((drawEnd + HOLD - 0.1 - time) / 0.9)));

        // Heading ink and caption state follow the same progress
        const q = clamp01(p / 0.22);
        if (fillRef.current) fillRef.current.style.clipPath = q >= 1 ? 'inset(-4% -4% -4% -4%)' : `inset(-4% ${((1 - q) * 100).toFixed(2)}% -4% -4%)`;
        if (railRef.current) railRef.current.style.transform = `scaleY(${clamp01(time / drawEnd).toFixed(4)})`;
        const step = time >= (stepStart[2] ?? Infinity) ? 2 : time >= (stepStart[1] ?? Infinity) ? 1 : 0;
        if (step !== lastStep) {
          lastStep = step;
          items.forEach((el, i) => el.setAttribute('data-active', String(i === step)));
        }
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} aria-label={title} className="relative h-[460svh] motion-reduce:h-auto">
      <div className="sticky top-0 flex h-[100svh] min-h-[36rem] items-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:py-24">
        <div className="mx-auto grid w-full max-w-[112.5rem] items-center gap-4 px-6 pt-20 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:pt-8">
          {/* Words */}
          <div className="relative z-10 lg:col-span-4">
            <div className="hand-note -rotate-2 text-[1.5rem] sm:text-[1.8rem]">{eyebrow}</div>
            <h2 className="relative mt-3 w-full">
              <span className="sr-only">{title}</span>
              <span aria-hidden="true" className="sketch-title intro-title-outline relative block">
                {title}
              </span>
              <span ref={fillRef} aria-hidden="true" className="sketch-title intro-title-fill absolute inset-0 block will-change-[clip-path]">
                {title}
              </span>
            </h2>

            <div className="relative mt-6 flex gap-5 lg:mt-10">
              <div aria-hidden="true" className="relative hidden w-px shrink-0 bg-[#1b1b1f]/15 lg:block">
                <div ref={railRef} className="absolute inset-0 origin-top bg-[#283f7d]" />
              </div>
              <ul ref={listRef} className="grid min-w-0 flex-1 gap-0 lg:block">
                {steps.map((s, i) => (
                  <li key={i} data-active="true" className="sketch-step lg:pb-7">
                    <div className="flex items-baseline gap-3">
                      <span className="hand-note text-[1.7rem]">{i + 1}</span>
                      <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1b1b1f]">{s.title}</h3>
                    </div>
                    <p className="mt-1 max-w-md pl-8 text-[15px] leading-relaxed text-[#4a463d]">{s.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The drawing */}
          <div className="relative lg:col-span-8">
            <svg
              ref={svgRef}
              viewBox="0 0 1000 630"
              role="img"
              aria-label="A pencil elevation of an arched podium and tower, drawn line by line"
              className="block h-auto max-h-[62svh] w-full overflow-visible lg:max-h-[78svh]"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {STROKES.map((s, i) => {
                const tone = TONES[s.tone];
                return (
                  <path
                    key={i}
                    data-stroke=""
                    d={s.d}
                    pathLength={1}
                    stroke={tone.stroke}
                    strokeWidth={tone.width}
                    strokeOpacity={tone.opacity}
                    strokeDasharray="1 2"
                    strokeDashoffset={0}
                  />
                );
              })}

              <g ref={labelsRef} fill={BLUE} style={{ fontFamily: 'var(--font-hand), cursive' }}>
                <text x="938" y="296" fontSize="24" textAnchor="middle" transform="rotate(-90 938 296)">
                  142.50
                </text>
                <text x="500" y="624" fontSize="24" textAnchor="middle">
                  58.40 m
                </text>
                {note && (
                  <text x="70" y="64" fontSize="26" fill="#6d675b" transform="rotate(-3 70 64)">
                    {note}
                  </text>
                )}
              </g>

              <g ref={handRef} opacity={0} pointerEvents="none">
                <SketchHandPhoto />
              </g>
            </svg>
          </div>
        </div>
      {/* Photo credit (the hand photo is free to use with attribution) */}
      <p className="pointer-events-none absolute bottom-5 right-6 z-30 text-[13px] text-[#6d675b] sm:right-10">
        Hand photo by{' '}
        <a
          href="https://www.magnific.com/free-photo/high-angle-shot-person-drawing-white-paper-with-blue-pencil_9283552.htm"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto underline decoration-[#6d675b]/40 underline-offset-2 hover:decoration-[#6d675b]"
        >
          wirestock on Magnific
        </a>
      </p>

      </div>
    </section>
  );
}
