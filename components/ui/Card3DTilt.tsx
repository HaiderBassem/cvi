'use client';

import React, { useRef, useState } from 'react';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
}

export default function Card3DTilt({
  children,
  className = '',
  maxTilt = 8,
  scale = 1.02,
}: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glareStyle, setGlareStyle] = useState<{ opacity: number; x: number; y: number }>({
    opacity: 0,
    x: 50,
    y: 50,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
    );

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlareStyle({
      opacity: 0.22,
      x: glareX,
      y: glareY,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlareStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {children}

      {/* Dynamic 3D Specular Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-inherit transition-opacity duration-300 z-20"
        style={{
          opacity: glareStyle.opacity,
          background: `radial-gradient(circle 300px at ${glareStyle.x}% ${glareStyle.y}%, rgba(255, 255, 255, 0.18), transparent 70%)`,
        }}
      />
    </div>
  );
}
