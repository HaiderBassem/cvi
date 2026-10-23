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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showCadGrid, setShowCadGrid] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentDrawing = drawings[activeIndex] || drawings[0];

  if (!currentDrawing) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] gap-4">
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
        <div className="flex items-center gap-6 font-mono text-[13px] text-white/76">
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
        <div className="flex items-center gap-2 px-6 py-2.5 bg-black/40 border-b border-white/5 font-mono text-xs overflow-x-auto">
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
              className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-[13px] whitespace-nowrap flex items-center gap-1.5 ${
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[520px] bg-neutral-950 overflow-hidden select-none ${
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
              priority
            />
          </div>
        </div>

        {/* Viewport Floating Info */}
        <div className="absolute top-4 left-4 pointer-events-none font-mono text-xs text-white/70 tracking-wider bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10">
          PAN: CLICK + DRAG · ZOOM: {(zoom * 100).toFixed(0)}%
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 rounded-sm bg-black/80 backdrop-blur-md border border-white/10 font-mono text-xs text-white z-20">
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-1.5 rounded-xs bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-xs bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetTransform}
            title="Reset View"
            className="p-1.5 rounded-xs bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-white/15 mx-1" />
          <button
            onClick={() => setShowCadGrid(!showCadGrid)}
            title="Toggle CAD Grid"
            className={`px-2 py-1 rounded-xs transition-colors cursor-pointer text-xs ${
              showCadGrid ? 'bg-skyblue text-black font-semibold' : 'bg-white/5 text-white/76 hover:text-white'
            }`}
          >
            CAD GRID
          </button>
        </div>
      </div>

      {/* Caption & Drawing Context */}
      {currentDrawing.caption && (
        <div className="px-6 py-3 bg-black/60 border-t border-white/10 font-mono text-xs text-white/76 flex items-start gap-2">
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
