'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePathname } from 'next/navigation';
import { BrandTectonicArmature, type ShadingMode } from './BrandTectonicArmature';
import { loadCity, buildCityMesh, CITY_ATTRIBUTION } from './RealCity';
import { Compass, Sun, Moon, Rotate3d } from 'lucide-react';


export function WebGLCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The scene is only visible behind the home, about, contact and archive pages.
  // Project case studies and the admin area are fully opaque, so rendering is paused there.
  const pathname = usePathname();
  const isHome = pathname === '/';
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = !(pathname.startsWith('/admin') || pathname.startsWith('/projects/'));
  }, [pathname]);

  // HUD State
  const [shadingMode, setShadingMode] = useState<ShadingMode>('pbr');
  const [isNight, setIsNight] = useState(false);
  const [isOrbitActive, setIsOrbitActive] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);

  // References to communicate with Three.js loop
  const armatureRef = useRef<BrandTectonicArmature | null>(null);
  const cityRef = useRef<ReturnType<typeof buildCityMesh> | null>(null);
  const shadingModeRef = useRef<ShadingMode>('pbr');
  const nightRef = useRef(false);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lightsRef = useRef<{
    sun: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
    ambient: THREE.AmbientLight;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      console.warn('WebGL not supported, falling back');
      return;
    }

    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.2 : 2.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 3D Scene & Perspective Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#07101a', 0.034);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 9.5);

    // Orbit Controls (for interactive 3D inspection)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 16;
    controls.minDistance = 3.5;
    controls.maxPolarAngle = Math.PI * 0.52; // prevent going below ground
    controls.enabled = false;
    controlsRef.current = controls;

    // 1. Authentic Brand Tectonic Armature with Project Spatial Panels
    const armature = new BrandTectonicArmature();
    scene.add(armature.group);
    armatureRef.current = armature;

    // 2. Ground plane
    const groundGeo = new THREE.PlaneGeometry(90, 90, 1, 1);
    groundGeo.rotateX(-Math.PI * 0.5);
    const groundMat = new THREE.MeshStandardMaterial({
      roughness: 0.95,
      metalness: 0.05,
      color: new THREE.Color('#141c25'),
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -3.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2b. The real neighbourhood around the studio (Al-Jadriya, Baghdad):
    // open-data footprints and heights, 1 scene unit = 20 m.
    const city = new THREE.Group();
    city.name = 'CVI_Real_City_Context';
    city.position.y = ground.position.y + 0.01;
    scene.add(city);
    let disposed = false;
    loadCity('studio')
      .then((data) => {
        if (disposed) return;
        const built = buildCityMesh(data, { metresPerUnit: 20 });
        city.add(built.mesh);
        cityRef.current = built;
        built.setMode(shadingModeRef.current);
        built.setNight(nightRef.current);
      })
      .catch((err) => console.warn('[webgl] real city context unavailable:', err));

    // 3. Floating 3D Architectural Dust & Coordinate Nodes
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 22;
      particleScales[i] = Math.random() * 0.04 + 0.01;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color('#4cb8f5'),
      size: 0.045,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight('#2b3c52', 1.5);
    scene.add(ambientLight);

    // Baghdad Directional Sun (high angle)
    const sunLight = new THREE.DirectionalLight('#f2f9ff', 2.8);
    sunLight.position.set(7, 12, 8);
    scene.add(sunLight);

    // Architectural Sky-blue Rim Light
    const rimLight = new THREE.DirectionalLight('#4cb8f5', 2.2);
    rimLight.position.set(-8, 5, -8);
    scene.add(rimLight);

    // Soft Blue Fill Light from bottom
    const fillLight = new THREE.DirectionalLight('#2a384c', 0.8);
    fillLight.position.set(0, -5, 5);
    scene.add(fillLight);

    lightsRef.current = {
      sun: sunLight,
      rim: rimLight,
      ambient: ambientLight,
    };

    // Tracking state for smooth camera transitions
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    const targetCameraPos = new THREE.Vector3(0, 0.5, 9.5);
    const targetCameraLookAt = new THREE.Vector3(0, 0.8, 0);
    const currentLookAt = new THREE.Vector3(0, 0.8, 0);

    const onPointerMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!activeRef.current) return;
      const time = clock.getElapsedTime();

      // Lerp mouse coordinates
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Update procedural brand armature and project panels
      armature.update(time);

      // Rotate particles and the city slowly
      particles.rotation.y = time * 0.015;
      city.rotation.y = time * 0.006;

      // Camera orchestration based on scroll progress (when free orbit is inactive)
      if (!controls.enabled) {
        const scrollY = window.scrollY;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scrollProgress = Math.min(1, Math.max(0, scrollY / maxScroll));

        // Multi-chapter camera trajectory framing authentic project panels
        if (scrollProgress < 0.25) {
          const t = scrollProgress / 0.25;
          targetCameraPos.set(
            THREE.MathUtils.lerp(0, 3.5, t) + mouse.x * 0.8,
            THREE.MathUtils.lerp(0.5, 1.8, t) + mouse.y * 0.5,
            THREE.MathUtils.lerp(9.5, 7.8, t)
          );
          targetCameraLookAt.set(0, 1.0 + t * 0.3, 0);
        } else if (scrollProgress < 0.6) {
          const t = (scrollProgress - 0.25) / 0.35;
          targetCameraPos.set(
            THREE.MathUtils.lerp(3.5, 5.2, t) + mouse.x * 0.6,
            THREE.MathUtils.lerp(1.8, 3.2, t) + mouse.y * 0.4,
            THREE.MathUtils.lerp(7.8, 5.5, t)
          );
          targetCameraLookAt.set(0, 1.2, 0);
        } else if (scrollProgress < 0.85) {
          const t = (scrollProgress - 0.6) / 0.25;
          targetCameraPos.set(
            THREE.MathUtils.lerp(5.2, 1.5, t) + mouse.x * 0.5,
            THREE.MathUtils.lerp(3.2, 2.0, t) + mouse.y * 0.4,
            THREE.MathUtils.lerp(5.5, 6.2, t)
          );
          targetCameraLookAt.set(0, 1.5, 0);
        } else {
          const t = (scrollProgress - 0.85) / 0.15;
          targetCameraPos.set(
            THREE.MathUtils.lerp(1.5, 0, t) + mouse.x * 0.4,
            THREE.MathUtils.lerp(2.0, 6.0, t),
            THREE.MathUtils.lerp(6.2, 7.0, t)
          );
          targetCameraLookAt.set(0, 0, 0);
        }

        // Smooth camera damping
        camera.position.lerp(targetCameraPos, 0.04);
        currentLookAt.lerp(targetCameraLookAt, 0.04);
        camera.lookAt(currentLookAt);

        // Subtle cinematic orientation
        armature.group.rotation.y = time * 0.03 + mouse.x * 0.12;
      } else {
        // Free Orbit Mode: update controls
        controls.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', onResize);

      armature.dispose();
      disposed = true;
      cityRef.current?.dispose();
      cityRef.current = null;
      groundGeo.dispose();
      groundMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Shading Mode
  useEffect(() => {
    if (armatureRef.current) {
      armatureRef.current.setShadingMode(shadingMode);
    }
    shadingModeRef.current = shadingMode;
    cityRef.current?.setMode(shadingMode);
  }, [shadingMode]);

  // Update Day/Night Mode
  useEffect(() => {
    if (armatureRef.current && lightsRef.current) {
      armatureRef.current.setNightMode(isNight);
      nightRef.current = isNight;
      cityRef.current?.setNight(isNight);
      if (isNight) {
        lightsRef.current.sun.intensity = 0.4;
        lightsRef.current.sun.color.set('#334466');
        lightsRef.current.rim.intensity = 3.5;
        lightsRef.current.rim.color.set('#5ec6ff');
        lightsRef.current.ambient.intensity = 0.5;
      } else {
        lightsRef.current.sun.intensity = 2.8;
        lightsRef.current.sun.color.set('#f2f9ff');
        lightsRef.current.rim.intensity = 2.2;
        lightsRef.current.rim.color.set('#4cb8f5');
        lightsRef.current.ambient.intensity = 1.2;
      }
    }
  }, [isNight]);

  // Toggle Orbit Controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = isOrbitActive;
    }
  }, [isOrbitActive]);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full -z-10 bg-[#070709] overflow-hidden">
      {/* 3D WebGL Canvas */}
      <canvas
        id="cvi-gl-root"
        ref={canvasRef}
        className={`w-full h-full ${isOrbitActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing z-10' : 'pointer-events-none'}`}
        aria-hidden="true"
      />

      {/* Floating 3D Spatial HUD Control Widget */}
      <aside
        aria-label="3D Spatial HUD"
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 transition-opacity duration-500 ${
          isHome ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        inert={!isHome}
      >
        <div className="bg-[#0e0e12]/90 backdrop-blur-md border border-white/10 rounded-sm p-3 text-xs font-mono text-white shadow-2xl flex flex-col gap-2 max-w-xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-skyblue">
              <Rotate3d className="w-3.5 h-3.5 text-skyblue animate-pulse" />
              <div className="flex flex-col">
                <span className="tracking-widest uppercase text-[10px] font-semibold text-white">
                  STUDIO BRAND ARTIFACT
                </span>
                <span className="text-[8px] text-skyblue uppercase tracking-wider">
                  + REAL CITY · AL-JADRIYA
                </span>
              </div>
            </div>
            <span className="text-[9px] text-white/40">
              {isOrbitActive ? '360° ORBIT' : 'CAMERA LINKED'}
            </span>
          </div>

          {/* Interactive Controls */}
          <div className="flex flex-col gap-2 pt-1">
            {/* 3D Free Orbit Button */}
            <button
              onClick={() => setIsOrbitActive(!isOrbitActive)}
              className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-sm transition-all text-[11px] cursor-pointer ${
                isOrbitActive
                  ? 'bg-skyblue text-black font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Compass className="w-3 h-3" />
                <span>360° Inspection</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider">
                {isOrbitActive ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

            {/* Shading Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-sm border border-white/5 text-[10px]">
              <button
                onClick={() => setShadingMode('pbr')}
                className={`py-1 text-center rounded-xs transition-colors cursor-pointer ${
                  shadingMode === 'pbr' ? 'bg-white/20 text-white font-semibold' : 'text-white/50 hover:text-white'
                }`}
              >
                PBR
              </button>
              <button
                onClick={() => setShadingMode('wireframe')}
                className={`py-1 text-center rounded-xs transition-colors cursor-pointer ${
                  shadingMode === 'wireframe' ? 'bg-skyblue text-black font-semibold' : 'text-white/50 hover:text-white'
                }`}
              >
                CAD
              </button>
              <button
                onClick={() => setShadingMode('clay')}
                className={`py-1 text-center rounded-xs transition-colors cursor-pointer ${
                  shadingMode === 'clay' ? 'bg-white/20 text-white font-semibold' : 'text-white/50 hover:text-white'
                }`}
              >
                CLAY
              </button>
            </div>

            {/* Light Direction / Studio Lighting Toggle */}
            <button
              onClick={() => setIsNight(!isNight)}
              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-white/80 transition-colors text-[11px] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                {isNight ? <Moon className="w-3 h-3 text-skyblue" /> : <Sun className="w-3 h-3 text-sky-300" />}
                <span>{isNight ? 'Evening Atmosphere' : 'Daylight Illumination'}</span>
              </span>
              <span className="text-[9px] text-white/40 uppercase">
                {isNight ? 'NIGHT' : 'DAY'}
              </span>
            </button>
          </div>

          {/* Coordinates & Status */}
          <div className="text-[9px] text-white/30 pt-1 border-t border-white/5 flex items-center justify-between">
            <span>BAGHDAD ATELIER</span>
            <span>33.2905° N, 44.3924° E</span>
          </div>
          <p className="text-[8px] leading-snug text-white/30 normal-case tracking-normal">{CITY_ATTRIBUTION}</p>
        </div>
      </aside>
    </div>
  );
}
