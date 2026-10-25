'use client';

import React, { useEffect, useRef } from 'react';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
}

/**
 * A card that leans toward the pointer. The motion is eased in a frame loop and written straight
 * to the element, so moving the mouse never re-renders React (which used to stutter with big images).
 */
export default function Card3DTilt({ children, className = '', maxTilt = 8, scale = 1.02 }: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    cur: { rx: 0, ry: 0, s: 1, gx: 50, gy: 50, go: 0 },
    to: { rx: 0, ry: 0, s: 1, gx: 50, gy: 50, go: 0 },
    raf: 0,
    enabled: true,
  });

  useEffect(() => {
    const st = state.current;
    st.enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !window.matchMedia('(pointer: coarse)').matches;
    return () => cancelAnimationFrame(st.raf);
  }, []);

  const frame = () => {
    const st = state.current;
    const { cur, to } = st;
    let moving = false;
    (Object.keys(cur) as (keyof typeof cur)[]).forEach((k) => {
      const d = to[k] - cur[k];
      if (Math.abs(d) > 0.002) {
        cur[k] += d * 0.14;
        moving = true;
      } else cur[k] = to[k];
    });
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(${cur.rx.toFixed(3)}deg) rotateY(${cur.ry.toFixed(3)}deg) scale3d(${cur.s.toFixed(4)}, ${cur.s.toFixed(4)}, ${cur.s.toFixed(4)})`;
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = cur.go.toFixed(3);
      glareRef.current.style.background = `radial-gradient(circle 300px at ${cur.gx.toFixed(1)}% ${cur.gy.toFixed(1)}%, rgba(255, 255, 255, 0.18), transparent 70%)`;
    }
    st.raf = moving ? requestAnimationFrame(frame) : 0;
  };

  const kick = () => {
    const st = state.current;
    if (!st.raf) st.raf = requestAnimationFrame(frame);
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const st = state.current;
    if (!st.enabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    st.to.rx = ((y - rect.height / 2) / (rect.height / 2)) * -maxTilt;
    st.to.ry = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;
    st.to.s = scale;
    st.to.gx = (x / rect.width) * 100;
    st.to.gy = (y / rect.height) * 100;
    st.to.go = 0.22;
    kick();
  };

  const onLeave = () => {
    const st = state.current;
    st.to.rx = 0;
    st.to.ry = 0;
    st.to.s = 1;
    st.to.go = 0;
    kick();
  };

  return (
    <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }} className={`relative ${className}`}>
      {children}

      {/* Specular glare that follows the pointer */}
      <div ref={glareRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" style={{ opacity: 0 }} />
    </div>
  );
}
