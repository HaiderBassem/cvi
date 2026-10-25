'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { SketchHandPhoto } from '@/components/site/SketchHandPhoto';
import { LOGO_GLYPHS, LOGO_VIEWBOX } from '@/lib/brand/logoGlyphs';
import { layoutStrokeText } from '@/lib/brand/strokeFont';

interface PreloaderProps {
  /** The letters drawn on the opening screen (edited in Admin → Site content). */
  text?: string;
  onComplete?: () => void;
}

type Stage = 'drawing' | 'done';

const INK = '#111114';

/** Tells the page (the home hero) that the screen is leaving, so its own entrance can start. */
function announceIntro() {
  document.documentElement.dataset.intro = 'ready';
  window.dispatchEvent(new Event('cvi:intro'));
}

/** Hand size in drawing units per photo pixel (the pencil is ~325 photo px long). */
const HAND_SCALE = 0.155;
const HAND_TILT = 24;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

interface Drawing {
  paths: { d: string; weight: number }[];
  viewBox: string;
  /** The studio's real logo is outlined and filled; custom letters are single strokes. */
  filled: boolean;
  strokeWidth: number;
  /** Width of the drawing on screen, per unit of the viewBox. */
  aspect: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

function buildDrawing(text: string): Drawing {
  const cleaned = text.trim().toUpperCase();
  if (cleaned === 'CVI' || cleaned === '') {
    const [x, y, w, h] = LOGO_VIEWBOX.split(' ').map(Number);
    return {
      paths: [
        { d: LOGO_GLYPHS.C, weight: 0.95 },
        { d: LOGO_GLYPHS.V, weight: 0.7 },
        { d: LOGO_GLYPHS.I, weight: 0.45 },
      ],
      viewBox: LOGO_VIEWBOX,
      filled: true,
      strokeWidth: 0.55,
      aspect: w / h,
      start: { x: x + w + 70, y: y + h + 60 },
      end: { x: x + w + 90, y: y - 40 },
    };
  }
  const lay = layoutStrokeText(cleaned);
  const pad = 16;
  const w = lay.width + pad * 2;
  const h = lay.height + pad * 2;
  const count = Math.max(1, lay.paths.length);
  return {
    paths: lay.paths.map((d) => ({ d, weight: Math.max(0.35, 1.6 / count + 0.15) })),
    viewBox: `${-pad} ${-pad} ${w} ${h}`,
    filled: false,
    strokeWidth: 4.5,
    aspect: w / h,
    start: { x: w + 130, y: h + 120 },
    end: { x: w + 160, y: -90 },
  };
}

/**
 * Opening screen: the studio's cream drafting sheet. A hand with a blue pencil draws the studio's
 * letters — the real logo outlines for CVI, line by line, the pencil tip riding the live end of
 * each stroke — inks them in, lifts away, and the whole sheet slides up to reveal the page.
 * It is part of the server-rendered page, so there is no flash of content first.
 */
export function Preloader({ text = 'CVI', onComplete }: PreloaderProps) {
  const drawing = useMemo(() => buildDrawing(text), [text]);
  const [stage, setStage] = useState<Stage>('drawing');
  const sheetRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const handRef = useRef<SVGGElement>(null);
  const fillRef = useRef<SVGGElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Respect reduced motion: no animation, just get out of the way.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('done');
      announceIntro();
      onCompleteRef.current?.();
      return;
    }

    const sheet = sheetRef.current;
    const svg = svgRef.current;
    const hand = handRef.current;
    const fill = fillRef.current;
    if (!sheet || !svg || !hand) return;

    // Hold the page still while the screen is up.
    const body = document.body;
    const prev = { overflow: body.style.overflow, overscroll: body.style.overscrollBehavior };
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    const release = () => {
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscroll;
    };

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-stroke]'));
    const lengths = paths.map((p) => p.getTotalLength());
    const tweens: gsap.core.Tween[] = [];
    let alive = true;
    let tickFn: ((t: number, d: number) => void) | null = null;
    let tl: gsap.core.Timeline | null = null;
    let skipped = false;

    const finish = () => {
      if (!alive) return;
      release();
      setStage('done');
      onCompleteRef.current?.();
    };

    const run = () => {
      if (!alive) return;
      gsap.set(paths, { strokeDashoffset: 1 });
      if (fill) gsap.set(fill, { opacity: 0 });

      tl = gsap.timeline();
      let t = 0;
      paths.forEach((p, i) => {
        const tw = gsap.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: drawing.paths[i].weight, ease: 'power1.inOut' });
        tweens.push(tw);
        tl!.add(tw, t + 0.5); // the hand needs a moment to arrive
        t += drawing.paths[i].weight + 0.2;
      });
      const drawEnd = t + 0.5;
      if (fill) tl.to(fill, { opacity: 1, duration: 0.45, ease: 'power1.out' }, drawEnd);
      const slideAt = drawEnd + 0.7;
      tl.to(sheet, { yPercent: -100, duration: 0.85, ease: 'power3.inOut', onStart: announceIntro, onComplete: finish }, slideAt);

      const start = paths[0].getPointAtLength(0);
      let target = { x: start.x, y: start.y };
      const cur = { x: drawing.start.x, y: drawing.start.y };
      let ended = false;

      tickFn = (_time, deltaMs) => {
        if (!tl) return;
        let active = -1;
        for (let i = 0; i < tweens.length; i++) {
          const pr = tweens[i].progress();
          if (pr > 0 && pr < 1) active = i;
        }
        let drawingNow = false;
        if (active >= 0) {
          const pt = paths[active].getPointAtLength(tweens[active].progress() * lengths[active]);
          target = { x: pt.x, y: pt.y };
          drawingNow = true;
        }
        ended = tl.time() >= drawEnd + 0.1;
        const aim = ended ? drawing.end : target;
        // while drawing the tip is locked to the stroke end; between strokes the hand glides like a real pen lift
        const k = 1 - Math.exp((-deltaMs / 1000) * (drawingNow ? 220 : ended ? 5 : 9));
        cur.x += (aim.x - cur.x) * k;
        cur.y += (aim.y - cur.y) * k;
        const wob = drawingNow ? Math.sin(performance.now() / 55) * 0.12 : 0;
        hand.setAttribute('transform', `translate(${(cur.x + wob).toFixed(2)} ${(cur.y + wob * 0.6).toFixed(2)})`);
        const approach = clamp01(Math.hypot(cur.x - drawing.start.x, cur.y - drawing.start.y) / 50);
        hand.setAttribute('opacity', String(ended ? clamp01((drawEnd + 0.9 - tl.time()) / 0.5) : Math.max(approach, 0)));
      };
      gsap.ticker.add(tickFn);
    };

    // Wait (briefly) for the hand photo so the pencil never pops in half-loaded.
    const img = new Image();
    img.src = '/brand/hand-pencil.png';
    const ready = Promise.race([img.decode().catch(() => undefined), new Promise((r) => window.setTimeout(r, 1400))]);
    ready.then(run);

    // Click or key press skips straight to the reveal.
    const skip = () => {
      if (skipped || !tl) return;
      skipped = true;
      tl.progress(1);
    };
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);

    return () => {
      alive = false;
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      if (tickFn) gsap.ticker.remove(tickFn);
      tl?.kill();
      release();
    };
  }, [drawing]);

  if (stage === 'done') return null;

  const [, , vw, vh] = drawing.viewBox.split(' ').map(Number);

  return (
    <div
      ref={sheetRef}
      role="status"
      aria-label="Loading CVI Architects"
      className="fixed left-0 top-0 z-[10000] flex w-screen select-none items-center justify-center overflow-hidden bg-[#f5f3ef] text-[#111114]"
      style={{ height: '100dvh', willChange: 'transform' }}
    >
      {/* Drafting-sheet crosshair guides */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black/10" />
        <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-black/10" />
      </div>
      <span className="sr-only">{text}</span>

      <svg
        ref={svgRef}
        viewBox={drawing.viewBox}
        aria-hidden="true"
        className="relative block h-auto overflow-visible"
        style={{ width: `min(88vw, clamp(300px, 42vw, 600px))`, aspectRatio: `${vw} / ${vh}` }}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {drawing.filled && (
          <g ref={fillRef} fill={INK} fillRule="evenodd" stroke="none" opacity={0}>
            {drawing.paths.map((p, i) => (
              <path key={i} d={p.d} />
            ))}
          </g>
        )}
        {drawing.paths.map((p, i) => (
          <path
            key={i}
            data-stroke=""
            d={p.d}
            pathLength={1}
            stroke={INK}
            strokeWidth={drawing.strokeWidth}
            strokeDasharray="1 2"
            strokeDashoffset={1}
          />
        ))}
        <g ref={handRef} opacity={0} pointerEvents="none">
          <SketchHandPhoto scale={HAND_SCALE} tilt={HAND_TILT} shadow={[1.6, 1.2]} />
        </g>
      </svg>
    </div>
  );
}
