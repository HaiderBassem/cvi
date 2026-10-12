'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/navigation/Header';
import { Preloader } from '@/components/ui/Preloader';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { WebGLCanvas } from '@/components/webgl/WebGLCanvas';

/**
 * Public-site chrome (header, cursor, preloader, smooth scroll, 3D scene).
 * The admin is a working tool with its own shell, so none of this mounts there —
 * smooth scrolling in particular fights the admin's scrollable drawers.
 */
export function SiteChrome({
  companyName,
  coordinates,
  children,
}: {
  companyName: string;
  coordinates: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <>{children}</>;

  return (
    <SmoothScroll>
      <Preloader />
      <CustomCursor />
      <WebGLCanvas />
      <div className="film-grain" aria-hidden="true" />
      <Header companyName={companyName} coordinates={coordinates} />
      <main className="relative z-10 flex flex-col min-h-screen">{children}</main>
    </SmoothScroll>
  );
}
