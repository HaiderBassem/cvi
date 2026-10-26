'use client';

import React, { useId, useState } from 'react';
import { PaperButton } from '@/components/site/PaperButton';

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqSectionProps {
  eyebrow: string;
  title: string;
  intro: string;
  cta: string;
  ctaHref: string;
  items: FaqItem[];
}

/**
 * Questions and answers: the heading stays pinned on the left while the list scrolls on the right.
 * One answer is open at a time; the panel opens by animating grid rows, so no height is measured.
 */
export function FaqSection({ eyebrow, title, intro, cta, ctaHref, items }: FaqSectionProps) {
  const [open, setOpen] = useState(0);
  const base = useId();
  const shown = items.filter((it) => it.q.trim());
  if (!shown.length) return null;

  return (
    <section className="mx-auto w-full max-w-[112.5rem] px-6 py-16 sm:px-10 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div data-reveal className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <div className="hand-note -rotate-2 text-[15px] sm:text-[18px]">{eyebrow}</div>
            <h2 className="section-title mt-3 text-[#1b1b1f]">{title}</h2>
            <p className="mt-5 max-w-sm text-[16px] font-medium leading-relaxed text-[#4a463d]">{intro}</p>
            {cta && (
              <div className="mt-8">
                <PaperButton href={ctaHref || '/contact'}>{cta}</PaperButton>
              </div>
            )}
          </div>
        </div>

        <div data-reveal className="lg:col-span-8">
          <ul className="border-b border-[#1b1b1f]/15">
            {shown.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={i} className="border-t border-[#1b1b1f]/15">
                  <h3>
                    <button
                      type="button"
                      id={`${base}-q${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`${base}-a${i}`}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      className="group flex w-full cursor-pointer items-start gap-5 py-6 text-left sm:gap-8 sm:py-7"
                    >
                      <span className="hand-note mt-1.5 w-8 shrink-0 text-[1.5rem] leading-none text-[#283f7d]">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex-1 font-grotesk text-[1.35rem] font-medium leading-snug tracking-[-0.03em] text-[#1b1b1f] transition-colors group-hover:text-[#283f7d] sm:text-[1.7rem]">
                        {item.q}
                      </span>
                      <span aria-hidden="true" className="relative mt-2 block h-5 w-5 shrink-0">
                        <span className="absolute left-0 top-1/2 h-px w-5 -translate-y-1/2 bg-[#1b1b1f]" />
                        <span className={`absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-[#1b1b1f] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'scale-y-0' : 'scale-y-100'}`} />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`${base}-a${i}`}
                    role="region"
                    aria-labelledby={`${base}-q${i}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-7 pl-[3.25rem] text-[16px] font-medium leading-[1.75] text-[#4a463d] sm:pl-[4.5rem] sm:text-[17px]">{item.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
