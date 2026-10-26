import React from 'react';
import { PaperButton } from '@/components/site/PaperButton';

export interface ApproachCard {
  name: string;
  tag: string;
  /** One item per line. */
  items: string;
  cta: string;
}

interface ApproachSectionProps {
  eyebrow: string;
  title: string;
  intro: string;
  badge: string;
  ctaHref: string;
  cards: ApproachCard[];
}

const PAPER = ['#fbf7ee', '#f3e8d0', '#e9eef7'];

/**
 * "Ways of working": three folder cards, each with a numbered tab, a dashed list of what is included
 * and a button. They lift on hover; the middle one wears a handwritten note.
 */
export function ApproachSection({ eyebrow, title, intro, badge, ctaHref, cards }: ApproachSectionProps) {
  return (
    <section className="mx-auto w-full max-w-[112.5rem] px-6 py-16 sm:px-10 sm:py-32">
      <div data-reveal className="mb-14 grid gap-6 sm:mb-20 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <div className="hand-note -rotate-2 text-[15px] sm:text-[18px]">{eyebrow}</div>
          <h2 className="section-title mt-3 text-[#1b1b1f]">{title}</h2>
        </div>
        <p className="max-w-md text-[16px] font-medium leading-relaxed text-[#4a463d] lg:col-span-5 lg:justify-self-end lg:text-right">{intro}</p>
      </div>

      <div data-reveal-group className="grid gap-x-6 gap-y-14 pt-4 md:grid-cols-3">
        {cards.map((card, i) => (
          <article key={i} className="folder group relative flex flex-col">
            {i === 1 && badge && (
              <span aria-hidden="true" className="hand-note absolute -top-9 right-3 -rotate-3 text-[15px] text-[#c8503f]">
                {badge}
              </span>
            )}
            <div className="relative z-[1] ml-5 flex w-fit items-baseline gap-3 rounded-t-lg border border-b-0 border-[#424242]/25 px-5 pb-2 pt-3" style={{ background: PAPER[i % PAPER.length] }}>
              <span className="hand-note text-[1.7rem] leading-none text-[#283f7d]">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div
              className="folder-body relative flex flex-1 flex-col border border-[#424242]/25 p-7 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 sm:p-9"
              style={{ background: PAPER[i % PAPER.length] }}
            >
              <h3 className="font-grotesk text-[2rem] font-medium leading-none tracking-[-0.045em] text-[#1b1b1f] sm:text-[2.6rem]">{card.name}</h3>
              <p className="mt-3 text-[15px] font-medium leading-snug text-[#5b564a]">{card.tag}</p>

              <ul className="mt-7 flex-1">
                {card.items
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((item, k) => (
                    <li key={k} className="relative border-b border-dashed border-[#a7a7a7] py-2.5 pl-6 text-[15px] leading-snug text-[#2e2b26] before:absolute before:left-0 before:top-[1.05rem] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#283f7d]">
                      {item}
                    </li>
                  ))}
              </ul>

              <div className="mt-8">
                <PaperButton href={ctaHref || '/contact'}>{card.cta}</PaperButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
