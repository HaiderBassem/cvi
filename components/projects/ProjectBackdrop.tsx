'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Moon, Sun, RotateCw, Maximize2, Hand, Loader2, Box } from 'lucide-react';
import type { BackdropEngine, ShadingMode } from './backdrop/engine';

export interface BackdropModelProp {
  id: string;
  label: string;
  url: string;
  bytes: number;
}

interface ProjectBackdropProps {
  /** The project's 3D model. Null = no model: the hero image is the backdrop. */
  model: BackdropModelProp | null;
  /** Hero image: shown while the model streams in, and instead of it when 3D is unavailable. */
  poster: string;
  title: string;
  /** Page background colour (project theme). */
  background: string;
}

type Phase = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported' | 'saver';

const SHADINGS: { id: ShadingMode; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'clay', label: 'Clay' },
  { id: 'blueprint', label: 'Blueprint' },
];

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * The project's backdrop. Render it inside the hero section (which must be `relative`): it paints a
 * fixed full-viewport layer behind the whole page, and an invisible drag surface over the hero.
 * three.js and the model are fetched only when this mounts, i.e. when a project page is opened.
 */
export function ProjectBackdrop({ model, poster, title, background }: ProjectBackdropProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BackdropEngine | null>(null);
  const [phase, setPhase] = useState<Phase>(model ? 'idle' : 'error');
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [shading, setShading] = useState<ShadingMode>('solid');
  const [night, setNight] = useState(false);
  const [spin, setSpin] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [hint, setHint] = useState(false);
  // The control panel starts open only where there is room beside the model.
  const [panel, setPanel] = useState(false);
  useEffect(() => {
    setPanel(window.matchMedia('(min-width: 1280px)').matches);
  }, []);

  const modelUrl = model?.url;
  const modelBytes = model?.bytes ?? 0;

  // Boot the engine and stream the model — only when this page is opened.
  useEffect(() => {
    if (!modelUrl) return;
    const host = canvasHostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(reducedMotion);
    if (reducedMotion) setSpin(false);

    if (!webglAvailable()) {
      setPhase('unsupported');
      return;
    }
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData && attempt === 0) {
      setPhase('saver');
      return;
    }

    let cancelled = false;
    // Each engine owns a fresh canvas, so remounting (Strict Mode, navigation) never reuses a lost context.
    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 h-full w-full';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    setPhase('loading');
    setProgress(0);
    (async () => {
      try {
        const { BackdropEngine } = await import('./backdrop/engine');
        if (cancelled) return;
        const engine = new BackdropEngine({ canvas, stage, reducedMotion });
        engineRef.current = engine;
        await engine.load({ url: modelUrl, bytes: modelBytes }, (r) => !cancelled && setProgress(r));
        if (cancelled) return;
        setPhase('ready');
        setHint(true);
        window.setTimeout(() => !cancelled && setHint(false), 5200);
      } catch (err) {
        if (!cancelled) {
          console.warn('[backdrop] 3D model unavailable:', err);
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      canvas.remove();
    };
  }, [modelUrl, modelBytes, attempt]);

  // Keep the engine in step with the controls.
  useEffect(() => {
    engineRef.current?.setShading(shading);
  }, [shading, phase]);
  useEffect(() => {
    engineRef.current?.setNight(night);
  }, [night, phase]);
  useEffect(() => {
    engineRef.current?.setAutoRotate(spin);
  }, [spin, phase]);

  // As the hero scrolls away the scene settles back and dims, so the page copy stays readable.
  useEffect(() => {
    const layer = layerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const heroH = stage.parentElement?.clientHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / (heroH * 0.85)));
      layer.style.setProperty('--dim', String(1 - p * 0.72));
      engineRef.current?.setScroll(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const interactive = phase === 'ready';
  const showPoster = phase !== 'ready';

  const chip =
    'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue';

  return (
    <>
      {/* Fixed backdrop behind the whole page */}
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{
          ['--dim' as string]: 1,
          background: night
            ? `radial-gradient(120% 90% at 72% 38%, #0b1626 0%, #060a11 55%, #030508 100%)`
            : `radial-gradient(120% 90% at 72% 38%, #17283b 0%, #0d1621 48%, ${background} 100%)`,
          transition: 'background 900ms ease',
        }}
      >
        {/* Hero image: instant backdrop while the model streams, and the fallback when 3D is unavailable */}
        <div
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
          style={{ opacity: showPoster ? 0.5 : 0 }}
        >
          <Image src={poster} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/70 to-[#0a0a0c]/25" />
        </div>

        <div
          ref={canvasHostRef}
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
          style={{ opacity: interactive ? 'var(--dim)' : 0 }}
        />

        {/* Vignette keeps headline and controls legible over the scene */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,12,0.78)_0%,rgba(10,10,12,0.3)_42%,rgba(10,10,12,0)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0c]/85 to-transparent" />
      </div>

      {/* Drag surface over the hero (empty space only — copy above it ignores the pointer) */}
      {model && (
        <div
          ref={stageRef}
          data-cursor="none"
          role="img"
          aria-label={`Interactive 3D model of ${title}. Drag to rotate.`}
          className={`absolute inset-0 z-[1] ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
        />
      )}
      {!model && <div ref={stageRef} className="hidden" />}

      {model && (
        <div className="pointer-events-none absolute right-4 top-40 z-20 flex max-w-[calc(100%-2rem)] flex-col items-end gap-3 sm:bottom-10 sm:right-10 sm:top-auto">
          {/* Loading */}
          {phase === 'loading' && (
            <div role="status" className="w-64 rounded-sm border border-white/10 bg-black/55 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between text-[13px] text-white/85">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-skyblue" aria-hidden="true" />
                  Loading 3D model
                </span>
                <span className="tabular-nums text-white/70">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-px w-full bg-white/15">
                <div className="h-px bg-skyblue transition-[width] duration-300 ease-out" style={{ width: `${Math.max(4, progress * 100)}%` }} />
              </div>
            </div>
          )}

          {(phase === 'error' || phase === 'unsupported') && (
            <div role="status" className="pointer-events-auto rounded-sm border border-white/10 bg-black/60 px-4 py-3 text-[13px] text-white/80 backdrop-blur-md">
              {phase === 'unsupported' ? '3D view isn’t supported on this device.' : '3D model couldn’t be loaded.'}{' '}
              {phase === 'error' && (
                <button type="button" onClick={retry} className="ml-1 cursor-pointer text-skyblue underline underline-offset-4 hover:text-skyblue-light">
                  Try again
                </button>
              )}
            </div>
          )}

          {phase === 'saver' && (
            <button
              type="button"
              onClick={retry}
              className={`${chip} pointer-events-auto border border-white/15 bg-black/60 text-white backdrop-blur-md hover:bg-black/80`}
            >
              <Box className="h-4 w-4 text-skyblue" aria-hidden="true" />
              Load interactive 3D view ({(modelBytes / 1048576).toFixed(1)} MB)
            </button>
          )}

          {/* Hint */}
          <div
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 text-[13px] text-white/90 backdrop-blur-md transition-opacity duration-700 ${
              hint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Hand className="h-4 w-4 text-skyblue" aria-hidden="true" />
            {reduced ? 'Drag to turn the model' : 'Drag to turn · scroll to read on'}
          </div>

          {/* Controls */}
          {interactive && (
            <button
              type="button"
              onClick={() => setPanel((v) => !v)}
              aria-expanded={panel}
              aria-controls="backdrop-controls"
              className={`${chip} pointer-events-auto border border-white/15 bg-black/55 text-white backdrop-blur-md hover:bg-black/75`}
            >
              <Box className="h-4 w-4 text-skyblue" aria-hidden="true" />
              {panel ? 'Hide controls' : '3D controls'}
            </button>
          )}
          {interactive && panel && (
            <div id="backdrop-controls" className="pointer-events-auto flex flex-col items-end gap-2 rounded-sm border border-white/10 bg-black/55 p-2.5 backdrop-blur-md">
              <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1" role="group" aria-label="Shading style">
                {SHADINGS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShading(s.id)}
                    aria-pressed={shading === s.id}
                    className={`${chip} ${shading === s.id ? 'bg-skyblue font-semibold text-black' : 'text-white/80 hover:text-white'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNight((v) => !v)}
                  aria-pressed={night}
                  className={`${chip} bg-white/[0.06] text-white hover:bg-white/10`}
                >
                  {night ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
                  {night ? 'Evening' : 'Daylight'}
                </button>
                <button
                  type="button"
                  onClick={() => setSpin((v) => !v)}
                  aria-pressed={spin}
                  aria-label="Toggle slow rotation"
                  className={`${chip} ${spin ? 'bg-skyblue font-semibold text-black' : 'bg-white/[0.06] text-white hover:bg-white/10'}`}
                >
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Rotate</span>
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.resetView()}
                  aria-label="Reset view"
                  className={`${chip} bg-white/[0.06] text-white hover:bg-white/10`}
                >
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
              <p className="max-w-[17rem] text-right text-xs leading-snug text-white/60">
                {model.label} · rendered from the studio’s design model. Finishes are illustrative.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
