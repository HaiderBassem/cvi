import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

/**
 * The studio's button on the cream sheet: a square arrow tab beside a label that rolls up on hover.
 * Used by the process scroll, the "ways of working" cards and the FAQ.
 */
export function PaperButton({ href, children, className = '' }: { href: string; children: string; className?: string }) {
  const external = /^https?:\/\//.test(href);
  return (
    <Link
      href={href || '/'}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`group inline-flex h-12 overflow-hidden rounded-lg ${className}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-l-lg border border-[#a19d94] bg-white text-[#283f7d] transition-colors duration-300 group-hover:bg-[#283f7d] group-hover:text-white">
        <ArrowUpRight className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="relative flex h-12 min-w-[11rem] items-center justify-center overflow-hidden rounded-r-lg border-y border-r border-[#a19d94] bg-white/40 px-6 text-[14px] font-medium text-[#414141]">
        <span className="block whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[160%]">{children}</span>
        <span aria-hidden="true" className="absolute block translate-y-[160%] whitespace-nowrap text-[#283f7d] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
          {children}
        </span>
      </span>
    </Link>
  );
}
