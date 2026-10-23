'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/site/Footer';
import { Preloader } from '@/components/ui/Preloader';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import type { SiteChromeData } from '@/lib/site/chrome';

/**
 * Public-site chrome (header, cursor, preloader, smooth scroll).
 * There is deliberately no site-wide 3D scene: each project page loads its own model on demand.
 * The admin is a working tool with its own shell, so none of this mounts there —
 * smooth scrolling in particular fights the admin's scrollable drawers.
 */
export function SiteChrome({ chrome, children }: { chrome: SiteChromeData; children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <>{children}</>;

  return (
    <SmoothScroll>
      <Preloader text={chrome.loader.text} image={chrome.loader.image} />
      <CustomCursor />
      <div className="film-grain" aria-hidden="true" />
      <Header chrome={chrome} />
      <main className="relative z-10 flex flex-col min-h-screen">{children}</main>
      <div className="relative z-10">
        <Footer chrome={chrome} />
      </div>
    </SmoothScroll>
  );
}
