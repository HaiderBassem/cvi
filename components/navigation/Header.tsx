'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import type { SiteChromeData } from '@/lib/site/chrome';

/**
 * Top bar and phone menu. Links, button, contact details and social links all come from the
 * admin (Menu & navigation, Site content, Studio settings) — nothing here is hard-coded.
 */
export function Header({ chrome }: { chrome: SiteChromeData }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { nav, cta, contact } = chrome;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : !/^https?:\/\//.test(href) && pathname.startsWith(href));
  const ctaExternal = /^https?:\/\//.test(cta.href);
  const linkProps = (external: boolean) => (external ? { target: '_blank', rel: 'noopener noreferrer' } : {});

  return (
    <>
      <header
        className={`header-bar fixed top-0 left-0 w-full z-[9000] px-6 sm:px-10 py-5 transition-all duration-500 pointer-events-none ${
          scrolled ? 'backdrop-blur-md bg-black/30 py-4' : 'py-6'
        }`}
      >
        <div className="header-ink max-w-[112.5rem] mx-auto flex items-center justify-between gap-4 text-white pointer-events-auto">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none" aria-label={`${chrome.companyName} homepage`}>
            <div className="w-8 h-8 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-xs tracking-widest text-white group-hover:border-skyblue group-hover:text-skyblue transition-colors">
              CVI
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-sm sm:text-base tracking-[0.15em] text-white truncate">{chrome.companyName}</span>
              {chrome.brandSubtitle && (
                <span className="text-xs uppercase tracking-widest text-white/70 hidden sm:inline-block">{chrome.brandSubtitle}</span>
              )}
            </div>
          </Link>

          {/* Main navigation (desktop) */}
          <nav aria-label="Main" className="hidden lg:flex items-center gap-9">
            {nav.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                {...linkProps(link.external)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`relative py-2 text-[15px] font-semibold tracking-wide transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-skyblue after:transition-transform after:duration-300 ${
                  isActive(link.href) ? 'text-white after:scale-x-100' : 'text-white/80 hover:text-white after:scale-x-0 hover:after:scale-x-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3 sm:gap-5">
            {cta.label && (
              <Link
                href={cta.href}
                {...linkProps(ctaExternal)}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/30 hover:border-skyblue hover:text-skyblue text-[14px] font-semibold tracking-wide transition-all duration-300"
              >
                <span>{cta.label}</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}

            {/* Menu button (phones and tablets) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[14px] font-semibold tracking-wide hover:bg-skyblue transition-colors cursor-pointer"
              aria-expanded={isMenuOpen}
              aria-controls="site-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <>
                  <span>Close</span>
                  <X className="w-4 h-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span>Menu</span>
                  <Menu className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen menu (phones and tablets) */}
      <div
        id="site-menu"
        data-lenis-prevent
        aria-hidden={!isMenuOpen}
        className={`lg:hidden fixed inset-0 z-[8999] bg-[#08080a]/[0.98] backdrop-blur-2xl transition-all duration-500 flex flex-col justify-between px-8 pb-10 pt-28 sm:px-16 overflow-y-auto ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav aria-label="Main" className="my-auto flex max-w-3xl flex-col gap-2 py-8">
          {nav.map((link, i) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              {...linkProps(link.external)}
              tabIndex={isMenuOpen ? 0 : -1}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className="group flex items-baseline gap-5 border-b border-white/10 py-5 text-white sm:gap-8"
            >
              <span className="w-8 text-sm font-semibold tracking-widest text-skyblue">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex flex-col">
                <span
                  className={`font-display text-5xl font-medium leading-none transition-transform duration-300 group-hover:translate-x-2 sm:text-6xl ${
                    isActive(link.href) ? 'text-skyblue' : 'text-white'
                  }`}
                >
                  {link.label}
                </span>
                {link.hint && <span className="mt-2 text-base text-white/70">{link.hint}</span>}
              </span>
            </Link>
          ))}
        </nav>

        <div className="grid w-full grid-cols-1 gap-6 border-t border-white/15 pt-8 text-[15px] text-white/80 md:grid-cols-3">
          <div>
            <div className="mb-1 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/60">Our studio</div>
            {contact.addressLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div>
            <div className="mb-1 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/60">Get in touch</div>
            {contact.email && (
              <a href={`mailto:${contact.email}`} tabIndex={isMenuOpen ? 0 : -1} className="block transition-colors hover:text-white">
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} tabIndex={isMenuOpen ? 0 : -1} className="block transition-colors hover:text-white">
                {contact.phone}
              </a>
            )}
          </div>
          {contact.socials.length > 0 && (
            <div>
              <div className="mb-1 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/60">Follow us</div>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {contact.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" tabIndex={isMenuOpen ? 0 : -1} className="transition-colors hover:text-white">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <Link href="/admin" tabIndex={isMenuOpen ? 0 : -1} className="mt-8 text-sm text-white/50 transition-colors hover:text-white">
          Admin login
        </Link>
      </div>
    </>
  );
}
