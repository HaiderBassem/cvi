'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Moon, Sun, RotateCw, Maximize2, Info, Loader2, MapPin } from 'lucide-react';
import type { ShadingMode } from '@/components/webgl/BrandTectonicArmature';
import { MassingFactory, classifyProject, MASSING_LABELS } from '@/components/webgl/MassingFactory';
import { buildCityMesh, loadCity, CITY_ATTRIBUTION, type CityData } from '@/components/webgl/RealCity';

interface ProjectMassingViewerProps {
  slug: string;
  title: string;
  typology?: string | null;
  /** Prepared real-city context for the project's location, if one exists. */
  place?: { key: string; name: string; approximate: boolean } | null;
}

type View = 'city' | 'concept';

const MODES: { id: ShadingMode; label: string }[] = [
  { id: 'pbr', label: 'Solid' },
  { id: 'clay', label: 'Clay' },
  { id: 'wireframe', label: 'CAD' },
];

/** Real metres per scene unit for the city view. */
const CITY_SCALE = 10;

export function ProjectMassingViewer({ slug, title, typology, place }: ProjectMassingViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{
    setMode: (m: ShadingMode) => void;
    setNight: (n: boolean) => void;
    setAutoRotate: (v: boolean) => void;
    reset: () => void;
  } | null>(null);

  const [view, setView] = useState<View>(place ? 'city' : 'concept');
  const [mode, setMode] = useState<ShadingMode>('pbr');
  const [night, setNight] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [unsupported, setUnsupported] = useState(false);
  const [cityState, setCityState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [cityStats, setCityStats] = useState<CityData['stats'] | null>(null);

  const kind = useMemo(() => classifyProject(typology, title), [typology, title]);
  const modeRef = useRef(mode);
  const nightRef = useRef(night);
  const autoRef = useRef(autoRotate);
  modeRef.current = mode;
  nightRef.current = night;
  autoRef.current = autoRotate;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      setUnsupported(true);
      return;
    }

    let disposed = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 2000);

    const hemi = new THREE.HemisphereLight('#d4ecff', '#35506a', 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight('#f2f9ff', 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = view === 'city';
    controls.maxPolarAngle = Math.PI * 0.47;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotate = autoRef.current && !reducedMotion;
    controls.autoRotateSpeed = view === 'city' ? 0.35 : 0.9;
    if (reducedMotion) setAutoRotate(false);

    const target = new THREE.Vector3();
    const homePos = new THREE.Vector3();
    const frame = (radius: number, height: number, closeness: number) => {
      target.set(0, height * 0.3, 0);
      const dist = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * closeness;
      homePos.set(0.85, 0.62, 1).normalize().multiplyScalar(dist).add(target);
      camera.position.copy(homePos);
      controls.target.copy(target);
      controls.minDistance = dist * 0.25;
      controls.maxDistance = dist * 1.8;
      camera.near = Math.max(0.05, dist / 500);
      camera.far = dist * 10;
      camera.updateProjectionMatrix();
      const s = radius * 1.1;
      sun.position.set(radius * 0.7, radius * 1.1, radius * 0.6);
      sun.shadow.camera.left = -s;
      sun.shadow.camera.right = s;
      sun.shadow.camera.top = s;
      sun.shadow.camera.bottom = -s;
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = radius * 4;
      sun.shadow.camera.updateProjectionMatrix();
      controls.update();
    };

    // ---- content
    let factory: MassingFactory | null = null;
    let building: THREE.Group | null = null;
    let city: ReturnType<typeof buildCityMesh> | null = null;
    const extras: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];

    const addExtra = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      extras.push({ geo, mat });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    };

    if (view === 'concept') {
      factory = new MassingFactory();
      building = factory.build(kind, slug, { site: true, edges: true });
      scene.add(building);
      factory.setMode(building, modeRef.current);
      factory.setNight(nightRef.current);
      const box = new THREE.Box3().setFromObject(building);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      frame(sphere.radius, box.max.y, 0.82);
    } else if (place) {
      setCityState('loading');
      frame(60, 2, 0.55);
      loadCity(place.key)
        .then((data) => {
          if (disposed) return;
          const radius = data.radius_m / CITY_SCALE;
          const base = addExtra(
            new THREE.CylinderGeometry(radius * 1.04, radius * 1.06, 0.6, 96),
            new THREE.MeshStandardMaterial({ color: '#1d2a37', roughness: 0.95 })
          );
          base.position.y = -0.3;
          base.receiveShadow = true;

          city = buildCityMesh(data, { metresPerUnit: CITY_SCALE });
          scene.add(city.mesh);
          city.setMode(modeRef.current);
          city.setNight(nightRef.current);

          // Reference point: a sky-blue ring and beam at the place's centre.
          const ring = addExtra(
            new THREE.RingGeometry(2.6, 3.2, 64),
            new THREE.MeshBasicMaterial({ color: '#4cb8f5', transparent: true, opacity: 0.85, side: THREE.DoubleSide })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.05;
          const beam = addExtra(
            new THREE.CylinderGeometry(0.18, 0.18, 14, 12),
            new THREE.MeshBasicMaterial({ color: '#4cb8f5', transparent: true, opacity: 0.55 })
          );
          beam.position.y = 7;

          frame(radius, 3, 0.55);
          setCityStats(data.stats);
          setCityState('ready');
        })
        .catch(() => {
          if (!disposed) setCityState('error');
        });
    }

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
    io.observe(host);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    api.current = {
      setMode: (m) => {
        if (factory && building) factory.setMode(building, m);
        city?.setMode(m);
      },
      setNight: (n) => {
        factory?.setNight(n);
        city?.setNight(n);
        hemi.intensity = n ? 0.32 : 1.0;
        hemi.color.set(n ? '#5b8fc4' : '#d4ecff');
        sun.intensity = n ? 0.55 : 2.6;
        sun.color.set(n ? '#7fb2ea' : '#f2f9ff');
        renderer.toneMappingExposure = n ? 1.25 : 1.05;
      },
      setAutoRotate: (v) => {
        controls.autoRotate = v;
      },
      reset: () => {
        camera.position.copy(homePos);
        controls.target.copy(target);
        controls.update();
      },
    };
    api.current.setNight(nightRef.current);

    return () => {
      disposed = true;
      api.current = null;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      controls.dispose();
      factory?.dispose();
      city?.dispose();
      extras.forEach(({ geo, mat }) => {
        geo.dispose();
        mat.dispose();
      });
      sun.shadow.map?.dispose();
      renderer.dispose();
    };
  }, [view, kind, slug, place]);

  useEffect(() => api.current?.setMode(mode), [mode]);
  useEffect(() => api.current?.setNight(night), [night]);
  useEffect(() => api.current?.setAutoRotate(autoRotate), [autoRotate]);

  const chip =
    'inline-flex items-center gap-2 px-3 py-2 rounded-full font-mono text-[11px] tracking-wider transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skyblue';

  return (
    <div className="w-full">
      {place && (
        <div role="tablist" aria-label="3D view" className="inline-flex mb-3 p-1 rounded-full border border-white/10 bg-white/[0.03]">
          {(
            [
              { id: 'city', label: 'Real city context' },
              { id: 'concept', label: 'Concept massing' },
            ] as { id: View; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              onClick={() => setView(t.id)}
              className={`px-4 py-1.5 rounded-full font-mono text-[11px] tracking-wider uppercase transition-colors cursor-pointer ${
                view === t.id ? 'bg-skyblue text-black font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={hostRef}
        data-cursor="none"
        className={`relative w-full h-[440px] sm:h-[600px] overflow-hidden rounded-sm border border-white/10 transition-[background] duration-700 ${
          night
            ? 'bg-[linear-gradient(180deg,#04101d_0%,#0a2238_55%,#12324f_100%)]'
            : 'bg-[linear-gradient(180deg,#9ddcfc_0%,#4cb8f5_48%,#1f78b4_100%)]'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
          role="img"
          aria-label={
            view === 'city' && place
              ? `Interactive 3D model of the real buildings around ${place.name}. Drag to rotate, scroll to zoom.`
              : `Interactive illustrative 3D massing for ${title}. Drag to rotate, scroll to zoom.`
          }
        />

        {unsupported && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center font-mono text-xs text-white/80">
            3D view is not supported on this device or browser.
          </div>
        )}

        {view === 'city' && cityState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 font-mono text-xs text-white" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading real city data…
          </div>
        )}
        {view === 'city' && cityState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
            <p className="font-mono text-xs text-white">The city data could not be loaded.</p>
            <button type="button" onClick={() => setView('concept')} className={`${chip} bg-black/55 text-white hover:bg-black/75`}>
              Show concept massing
            </button>
          </div>
        )}

        {/* Label — always says what you are looking at */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
          <div className="bg-black/55 backdrop-blur-md px-3 py-2 rounded-sm font-mono text-[10px] tracking-widest uppercase text-white/90 leading-relaxed max-w-[min(100%,26rem)]">
            {view === 'city' && place ? (
              <>
                <div className="flex items-center gap-2 text-skyblue-light">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  <span>Real city context · {place.name}</span>
                </div>
                <div className="text-white/65 normal-case tracking-wide mt-0.5">
                  {cityStats ? `${cityStats.buildings.toLocaleString()} real buildings within 600 m. ` : ''}
                  {place.approximate
                    ? 'Centred on the city — the blue marker is a reference point, not the exact project site.'
                    : 'Centred on the CVI studio.'}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-skyblue-light">
                  <Info className="w-3 h-3" aria-hidden="true" />
                  <span>Conceptual massing · not to scale</span>
                </div>
                <div className="text-white/60 normal-case tracking-wide mt-0.5">{MASSING_LABELS[kind]}</div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-full bg-black/55 backdrop-blur-md" role="group" aria-label="Shading style">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`${chip} ${mode === m.id ? 'bg-skyblue text-black font-semibold' : 'text-white/75 hover:text-white'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNight((v) => !v)}
              aria-pressed={night}
              className={`${chip} bg-black/55 backdrop-blur-md text-white hover:bg-black/75`}
            >
              {night ? <Moon className="w-3.5 h-3.5" aria-hidden="true" /> : <Sun className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{night ? 'Evening' : 'Daylight'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAutoRotate((v) => !v)}
              aria-pressed={autoRotate}
              aria-label="Toggle auto-rotate"
              className={`${chip} backdrop-blur-md ${autoRotate ? 'bg-skyblue text-black font-semibold' : 'bg-black/55 text-white hover:bg-black/75'}`}
            >
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Orbit</span>
            </button>
            <button type="button" onClick={() => api.current?.reset()} aria-label="Reset view" className={`${chip} bg-black/55 backdrop-blur-md text-white hover:bg-black/75`}>
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] text-white/40 tracking-wide leading-relaxed">
        {view === 'city' && place ? (
          <>
            Drag to rotate · right-drag to pan · scroll to zoom. Real footprints; heights are mapped where known, otherwise satellite-derived
            neighbourhood averages. {CITY_ATTRIBUTION}.
          </>
        ) : (
          <>
            Drag to rotate · scroll to zoom. An illustrative volumetric study based on the project typology — not the final designed building.
            Refer to the plans and renders for the project as designed.
          </>
        )}
      </p>
    </div>
  );
}
