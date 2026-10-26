'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers, MapPin, Check } from 'lucide-react';

export interface PlanDrawing {
  label: string;
  url: string;
  type?: 'plan' | 'elevation' | 'masterplan' | 'axonometric' | 'diagram';
  caption?: string;
}

interface ArchitecturalPlanViewerProps {
  title?: string;
  subtitle?: string;
  drawings: PlanDrawing[];
  verifiedArea?: string;
  verifiedLocation?: string;
  verifiedYear?: string;
  verifiedClient?: string;
}

export default function ArchitecturalPlanViewer({
  title = 'Architectural Drawing Documentation',
  subtitle = 'AUTHENTIC STUDIO DRAWING & SPATIAL DOCUMENTATION',
  drawings = [],
  verifiedArea,
  verifiedLocation,
  verifiedYear,
  verifiedClient,
}: ArchitecturalPlanViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCadGrid, setShowCadGrid] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  /** Pointers currently down (one finger pans, two fingers pinch). */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ pan: { x: 0, y: 0 }, zoom: 1, dist: 0 });
  const currentDrawing = drawings[activeIndex] || drawings[0];

  if (!currentDrawing) return null;

  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-viewer-controls]')) return;
    containerRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { pan, zoom, dist: pointers.current.size === 2 ? pinchDistance() : 0 };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);
    if (pointers.current.size === 2) {
      const d = pinchDistance();
      if (gesture.current.dist > 0) setZoom(Math.min(3.5, Math.max(0.75, gesture.current.zoom * (d / gesture.current.dist))));
    } else {
      // At rest a finger scrolls the page; it only moves the drawing once zoomed in.
      if (e.pointerType === 'touch' && zoom <= 1) return;
      const next = { x: gesture.current.pan.x + (now.x - last.x), y: gesture.current.pan.y + (now.y - last.y) };
      gesture.current.pan = next;
      setPan(next);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setIsDragging(false);
    else gesture.current = { pan, zoom, dist: 0 };
  };

  const resetTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 3.5));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.75));

  return (
    <div className="w-full my-16 border border-white/15 rounded-sm bg-[#09090d] overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-4 sm:px-6 border-b border-white/10 bg-white/[0.02] gap-4">
        <div>
          <div className="font-mono text-xs text-skyblue uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-skyblue animate-pulse" />
            <span>{subtitle}</span>
          </div>
          <h3 className="card-title text-white font-display text-lg sm:text-xl">
            {title}
          </h3>
        </div>

        {/* Verified Technical Facts (Real Data Only) */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[13px] text-white/76">
          {verifiedArea && (
            <div>
              <span className="text-white/55 block text-xs uppercase">VERIFIED SCOPE</span>
              <span className="text-white font-medium">{verifiedArea}</span>
            </div>
          )}
          {verifiedLocation && (
            <div>
              <span className="text-white/55 block text-xs uppercase">TERRITORY</span>
              <span className="text-white font-medium">{verifiedLocation}</span>
            </div>
          )}
          {verifiedClient && (
            <div>
              <span className="text-white/55 block text-xs uppercase">COMMISSION</span>
              <span className="text-white font-medium">{verifiedClient}</span>
            </div>
          )}
        </div>
      </div>

      {/* Drawing Tabs (if multiple drawings available) */}
      {drawings.length > 1 && (
        <div className="no-scrollbar flex items-center gap-2 px-4 py-2.5 sm:px-6 bg-black/40 border-b border-white/5 font-mono text-xs overflow-x-auto">
          <span className="text-white/62 text-xs uppercase mr-2 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-skyblue" />
            <span>DRAWING:</span>
          </span>
          {drawings.map((d, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                resetTransform();
              }}
              className={`px-3 py-2 sm:py-1 rounded-xs transition-colors cursor-pointer text-[13px] whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeIndex === idx
                  ? 'bg-skyblue text-black font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-white/82'
              }`}
            >
              <span>{d.label}</span>
              {d.type && (
                <span className="text-xs opacity-60 uppercase">[{d.type}]</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Zoomed in, a finger moves the drawing; at rest it still scrolls the page past it.
        style={{ touchAction: zoom > 1 || isDragging ? 'none' : 'pan-y' }}
        className={`relative w-full h-[min(520px,68svh)] bg-neutral-950 overflow-hidden select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* CAD Grid Overlay */}
        {showCadGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(76, 184, 245, 0.4) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(76, 184, 245, 0.4) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        )}

        {/* Image Content Container with Pan & Zoom */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="relative w-[92%] h-[92%] max-w-5xl">
            <Image
              src={currentDrawing.url}
              alt={currentDrawing.label}
              fill
              className="object-contain"
              sizes="(max-width: 1200px) 100vw, 1200px"
              draggable={false}
              priority
            />
          </div>
        </div>

        {/* Viewport Floating Info */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 pointer-events-none font-mono text-xs text-white/70 tracking-wider bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10">
          <span className="sm:hidden">DRAG · PINCH · {(zoom * 100).toFixed(0)}%</span>
          <span className="hidden sm:inline">PAN: CLICK + DRAG · ZOOM: {(zoom * 100).toFixed(0)}%</span>
        </div>

        {/* Floating Controls Bar */}
        <div data-viewer-controls className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 p-1.5 rounded-sm bg-black/80 backdrop-blur-md border border-white/10 font-mono text-xs text-white z-20">
          <button
            onClick={zoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            className="p-2.5 sm:p-1.5 rounded-xs bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="p-2.5 sm:p-1.5 rounded-xs bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetTransform}
            title="Reset View"
            aria-label="Reset View"
            className="p-2.5 sm:p-1.5 rounded-xs bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-white/15 mx-1" />
          <button
            onClick={() => setShowCadGrid(!showCadGrid)}
            title="Toggle CAD Grid"
            className={`px-2.5 py-2.5 sm:px-2 sm:py-1 rounded-xs transition-colors cursor-pointer text-xs ${
              showCadGrid ? 'bg-skyblue text-black font-semibold' : 'bg-white/5 text-white/76 hover:text-white'
            }`}
          >
            CAD GRID
          </button>
        </div>
      </div>

      {/* Caption & Drawing Context */}
      {currentDrawing.caption && (
        <div className="px-4 sm:px-6 py-3 bg-black/60 border-t border-white/10 font-mono text-xs text-white/76 flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
          <span className="text-skyblue font-semibold uppercase text-xs flex-shrink-0 mt-0.5">
            ARCHITECTURAL NOTE:
          </span>
          <p className="text-[13px] leading-relaxed font-normal text-white/75">
            {currentDrawing.caption}
          </p>
        </div>
      )}
    </div>
  );
}
