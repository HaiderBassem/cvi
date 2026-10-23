'use client';

import React from 'react';
import Link from 'next/link';
import type { SiteChromeData } from '@/lib/site/chrome';

/** Site-wide footer. Every text, link and contact detail comes from the admin. */
export function Footer({ chrome }: { chrome: SiteChromeData }) {
  const { footer, nav, contact } = chrome;

  return (
    <footer className="w-full border-t border-white/15 bg-[#060608]">
      <div className="mx-auto w-full max-w-[112.5rem] px-6 pb-12 pt-16 sm:px-12 sm:pt-20">
        <div className="mb-14 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-6 w-44">
              <svg viewBox="0 0 248.16 74.16" className="h-auto w-full text-white" fill="currentColor" role="img" aria-label={chrome.companyName}>
                <use href="/cvi-arch-logo.svg#cvi-arch-logo" />
              </svg>
            </div>
            {footer.blurb && <p className="mb-6 max-w-sm text-[15px] leading-relaxed text-white/76">{footer.blurb}</p>}
          </div>

          <div>
            <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/62">{footer.menuTitle}</div>
            <ul className="flex flex-col gap-2.5 text-[15px] text-white/88">
              {nav.map((n) => (
                <li key={n.href + n.label}>
                  <Link
                    href={n.href}
                    {...(n.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="transition-colors hover:text-skyblue"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="text-white/55 transition-colors hover:text-skyblue">
                  Admin login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/62">{footer.studioTitle}</div>
            <p className="mb-4 text-[15px] leading-relaxed text-white/82">
              {contact.addressLines.map((l, i) => (
                <React.Fragment key={l}>
                  {i > 0 && <br />}
                  {l}
                </React.Fragment>
              ))}
            </p>
            <div className="flex flex-col gap-1 text-[15px] text-white/88">
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="transition-colors hover:text-skyblue">
                  {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="break-all transition-colors hover:text-skyblue">
                  {contact.email}
                </a>
              )}
            </div>
            {contact.socials.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                {contact.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-skyblue">
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[13px] text-white/62 sm:flex-row">
          <div className="text-center sm:text-left">{footer.copyright}</div>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer transition-colors hover:text-white">
            {footer.backToTop} ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
