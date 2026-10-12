'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  companyName?: string;
  coordinates?: string;
}

export function Header({
  companyName = 'CVI ARCHITECTS',
  coordinates = '33.2905° N, 44.3924° E',
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Overview', href: '/', num: '01' },
    { label: 'Architecture', href: '/projects', num: '02' },
    { label: 'Atelier Story', href: '/about', num: '03' },
    { label: 'Direct Dialogue', href: '/contact', num: '04' },
    { label: 'Studio CMS', href: '/admin', num: '05' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-[9000] px-6 sm:px-10 py-5 transition-all duration-500 pointer-events-none ${
          scrolled ? 'backdrop-blur-md bg-black/30 py-4' : 'py-6'
        }`}
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between text-white pointer-events-auto">
          {/* Brand Logo Lockup */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="CVI Architects Homepage"
          >
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center font-mono text-[10px] tracking-widest text-white group-hover:border-skyblue group-hover:text-skyblue transition-colors">
              CVI
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sm sm:text-base tracking-[0.15em] text-white">
                {companyName}
              </span>
              <span className="text-[9px] font-mono tracking-widest text-white/50 hidden sm:inline-block">
                BAGHDAD ATELIER
              </span>
            </div>
          </Link>

          {/* Center Coordinates & Status (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 font-mono text-[11px] tracking-widest text-white/70">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{coordinates}</span>
            </div>
            <span className="text-white/20">|</span>
            <span className="text-white/60">AL-JADRIYA • MINISTERS ST</span>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Quick Contact CTA */}
            <Link
              href="/contact"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-skyblue hover:text-skyblue font-mono text-[11px] tracking-widest transition-all duration-300"
            >
              <span>INQUIRE</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-mono text-[11px] tracking-widest hover:bg-skyblue hover:text-white transition-colors cursor-pointer font-medium"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                <>
                  <span>CLOSE</span>
                  <X className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>MENU</span>
                  <Menu className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Architectural Navigation Overlay */}
      <div
        className={`fixed inset-0 z-[8999] bg-[#08080a]/98 backdrop-blur-2xl transition-all duration-700 flex flex-col justify-between p-8 sm:p-16 overflow-y-auto ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Top Header Placeholder */}
        <div className="w-full flex justify-between items-center pt-4">
          <div className="text-[11px] font-mono tracking-widest text-white/40">
            SYSTEM INDEX • CVI ARCH
          </div>
          <div className="text-[11px] font-mono tracking-widest text-white/40">
            2026 EDITION
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="my-auto py-12 flex flex-col gap-4 sm:gap-6 max-w-4xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-baseline gap-4 sm:gap-8 text-white focus:outline-none"
              >
                <span className="font-mono text-xs sm:text-sm text-skyblue tracking-widest">
                  {link.num}
                </span>
                <span
                  className={`font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-4 ${
                    isActive ? 'text-skyblue' : 'text-white/90 group-hover:text-white'
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Metadata & Coordinates */}
        <div className="w-full border-t border-white/10 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs text-white/60">
          <div>
            <div className="text-white/40 uppercase mb-1">BAGHDAD ATELIER</div>
            <div>Al-Wuzara St, Al-Jadriya</div>
            <div className="text-white/40">33.2905° N, 44.3924° E</div>
          </div>
          <div>
            <div className="text-white/40 uppercase mb-1">DIRECT COMMUNICATONS</div>
            <a href="mailto:info@cvi-iq.com" className="hover:text-white block transition-colors">
              info@cvi-iq.com
            </a>
            <a href="tel:+9647819975070" className="hover:text-white block transition-colors">
              +964 781 997 5070
            </a>
          </div>
          <div>
            <div className="text-white/40 uppercase mb-1">SOCIAL ARCHIVE</div>
            <div className="flex gap-4">
              <a href="https://instagram.com/cvi.arch" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Instagram
              </a>
              <a href="https://facebook.com/profile.php?id=61578697355535" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Facebook
              </a>
              <a href="https://x.com/CVIarch" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                X / Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
