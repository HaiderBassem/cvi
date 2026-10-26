'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProjectRecord, DisciplineRecord, GlobalSettings, SiteContent, TeamMemberRecord } from '@/lib/db/types';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import Card3DTilt from '@/components/ui/Card3DTilt';
import { IntroHero } from '@/components/site/IntroHero';
import { BlueprintSheet } from '@/components/site/BlueprintSheet';
import { FeatureScroll } from '@/components/site/FeatureScroll';
import { LetterSection } from '@/components/site/LetterSection';
import { ApproachSection } from '@/components/site/ApproachSection';
import { FaqSection } from '@/components/site/FaqSection';
import TeamPhoto from '@/components/site/TeamPhoto';
import { HOME_SECTIONS, visibleIds, type HomeSectionId, type LayoutEntry } from '@/lib/content/layout';

const HOME_IDS = HOME_SECTIONS.map((section) => section.id);
import { fillCount } from '@/lib/content/copy';

/** Featured work in an arched frame, slowly cross-fading between projects. */
function HeroShowcase({ projects, label }: { projects: ProjectRecord[]; label: string }) {
  const shown = projects.filter((p) => p.thumbnail_url || p.hero_image_url).slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shown.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % shown.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [shown.length]);

  if (!shown.length) return null;
  const current = shown[index % shown.length];

  return (
    <div className="mx-auto w-full max-w-[22rem] lg:ml-auto lg:mr-0">
      <div className="relative">
        {/* Offset hairline arch behind the frame */}
        <div aria-hidden="true" className="arch-frame absolute -right-3 -top-3 h-full w-full border border-[#283f7d]/40 sm:-right-6 sm:-top-6" />
        <Link
          href={`/projects/${current.slug}`}
          data-cursor="view"
          aria-label={`View ${current.title}`}
          className="arch-frame relative block aspect-[3/3.7] w-full bg-[#d9ccb0] shadow-[0_18px_40px_-18px_rgba(40,30,10,0.35)]"
        >
          {shown.map((p, i) => (
            <Image
              key={p.id}
              src={(p.thumbnail_url || p.hero_image_url) as string}
              alt={i === index ? p.title : ''}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 90vw, 32vw"
              className={`object-cover transition-opacity duration-[1600ms] ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </Link>
      </div>

      <div className="mt-7 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#283f7d]">{label}</div>
          <div className="truncate font-grotesk text-2xl font-medium text-[#1b1b1f]">{current.title}</div>
          <div className="text-sm text-[#5b564a]">
            {current.location} · {current.year}
          </div>
        </div>
        <div className="-mr-2 flex shrink-0 items-center" role="group" aria-label="Choose featured project">
          {shown.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${p.title}`}
              aria-current={i === index}
              className="group/dot flex h-9 cursor-pointer items-center px-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-[#283f7d]' : 'w-3 bg-[#1b1b1f]/25 group-hover/dot:bg-[#1b1b1f]/50'}`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface HomeClientProps {
  featuredProjects: ProjectRecord[];
  allProjects: ProjectRecord[];
  disciplines: DisciplineRecord[];
  settings: GlobalSettings;
  content: SiteContent;
  team: TeamMemberRecord[];
  /** The group photo the team is placed on (Admin → Team). */
  teamPhoto: string;
  teamPhotoSize: { width: number; height: number };
  /** Order and visibility of the sections (Admin → Page layout). */
  layout: LayoutEntry<HomeSectionId>[];
}

export function HomeClient({
  featuredProjects,
  allProjects,
  disciplines,
  settings,
  content,
  team,
  teamPhoto,
  teamPhotoSize,
  layout,
}: HomeClientProps) {
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineRecord | null>(disciplines[0] || null);

  /** Every section of the page, keyed by id; the order and visibility come from the admin. */
  const sections: Record<HomeSectionId, React.ReactNode> = {
    intro: (
        <IntroHero
          eyebrow={content.heroEyebrow || 'CVI Architects · Baghdad'}
          title={content.heroTitle}
          titleMuted={content.heroTitleMuted}
          body={content.heroBody}
          primaryCta={content.heroPrimaryCta}
          primaryHref={content.heroPrimaryHref}
          secondaryCta={content.heroSecondaryCta}
          secondaryHref={content.heroSecondaryHref}
          scrollCue={content.heroScrollCue}
          email={settings.email}
          images={featuredProjects
            .map((p) => ({ src: p.hero_image_url || p.thumbnail_url, alt: p.title }))
            .filter((img): img is { src: string; alt: string } => Boolean(img.src))}
        />
    ),
    drawing: (
        <FeatureScroll
          cta={content.featuresCta}
          ctaHref={content.featuresCtaHref}
          hint={content.featuresHint}
          features={[
            { note: content.feature1Note, title: content.feature1Title, text: content.feature1Text },
            { note: content.feature2Note, title: content.feature2Title, text: content.feature2Text },
            { note: content.feature3Note, title: content.feature3Title, text: content.feature3Text },
            { note: content.feature4Note, title: content.feature4Title, text: content.feature4Text },
            { note: content.feature5Note, title: content.feature5Title, text: content.feature5Text },
          ]}
        />
    ),
    letter: (
      <LetterSection eyebrow={content.letterEyebrow} title={content.letterTitle} body={content.letterBody} sign={content.letterSign} />
    ),
    glance: (
      <section className="mx-auto w-full max-w-[112.5rem] px-6 pb-16 pt-10 sm:px-12 sm:pb-32 sm:pt-16">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div data-reveal className="min-w-0 lg:col-span-7">
            <p className="editorial-body mb-14 max-w-2xl">{content.heroBody}</p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 border-t border-[#1b1b1f]/15 pt-8 sm:gap-x-8">
              {content.heroStats.map((st, i) => (
                <div key={i} className="min-w-0">
                  <div className="font-grotesk text-[clamp(2rem,9.5vw,3rem)] font-medium leading-none text-[#1b1b1f] sm:text-6xl">{fillCount(st.value, allProjects.length)}</div>
                  <div className="mt-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#5b564a]">{fillCount(st.label, allProjects.length)}</div>
                </div>
              ))}
            </div>
          </div>
          <div data-reveal className="min-w-0 lg:col-span-5">
            <HeroShowcase projects={featuredProjects} label={content.showcaseLabel} />
          </div>
        </div>
      </section>
    ),
    featured: (
      <section className="w-full py-16 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12">
        <div data-reveal className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 sm:mb-24 border-b border-[#1b1b1f]/12 pb-8">
          <div>
            <div className="font-mono text-xs text-[#283f7d] tracking-widest uppercase mb-2">
              {content.featuredEyebrow}
            </div>
            <h2 className="section-title font-grotesk text-[#1b1b1f]">
              {content.featuredTitle}
            </h2>
          </div>
          <p className="font-mono text-xs text-[#6d675b] max-w-xs text-left sm:text-right">
            {content.featuredIntro}
          </p>
        </div>

        {/* Vertical Chapter Portals */}
        <div className="flex flex-col gap-16 sm:gap-40">
          {featuredProjects.map((p, idx) => (
            <article
              key={p.id}
              data-reveal
              className="group relative flex flex-col lg:flex-row gap-10 lg:gap-16 items-start lg:items-center"
            >
              {/* Media Portal (Left on even, Right on odd) with 3D Perspective Tilt */}
              <div className={`w-full lg:w-7/12 ${idx % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                <Card3DTilt maxTilt={6} scale={1.015} className="w-full">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-[#1b1b1f]/12 bg-[#d9ccb0] shadow-[0_18px_40px_-18px_rgba(40,30,10,0.35)]">
                    <Link href={`/projects/${p.slug}`} className="block w-full h-full relative" data-cursor="view">
                      <Image
                        src={p.hero_image_url || '/baghdad-urban-map.jpg'}
                        alt={p.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                      
                      {/* Floating Micro Tag */}
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 font-mono text-xs tracking-widest text-white/90">
                        #{String(idx + 1).padStart(2, '0')} • {p.typology || 'Masterplan'}
                      </div>
                    </Link>
                  </div>
                </Card3DTilt>
              </div>

              {/* Text Narrative (Right on even, Left on odd) */}
              <div className={`w-full lg:w-5/12 flex flex-col ${
                idx % 2 === 1 ? 'lg:order-1' : 'lg:order-2'
              }`}>
                <div className="flex items-center gap-3 font-mono text-xs text-[#283f7d] mb-3 tracking-widest uppercase">
                  <span>{p.location || 'Iraq'}</span>
                  <span>•</span>
                  <span>{p.year || '2025'}</span>
                </div>

                <h3 className="card-title font-grotesk text-[#1b1b1f] mb-4 group-hover:text-[#283f7d] transition-colors">
                  <Link href={`/projects/${p.slug}`}>
                    {p.title}
                  </Link>
                </h3>

                <p className="text-[#3f3b33] text-sm sm:text-base font-normal leading-relaxed mb-6">
                  {p.summary || p.description}
                </p>

                {/* Technical Metric Row */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-[#1b1b1f]/12 font-mono text-xs mb-8">
                  <div>
                    <span className="text-[#6d675b] block text-xs uppercase mb-0.5">{content.cardScaleLabel}</span>
                    <span className="text-[#1b1b1f] font-medium">{p.size || 'Confidential'}</span>
                  </div>
                  <div>
                    <span className="text-[#6d675b] block text-xs uppercase mb-0.5">{content.cardPhaseLabel}</span>
                    <span className="text-[#1b1b1f] font-medium">{p.status || 'Active'}</span>
                  </div>
                </div>

                <Link
                  href={`/projects/${p.slug}`}
                  className="inline-flex items-center gap-3 font-mono text-xs text-[#1b1b1f] tracking-widest group-hover:text-[#283f7d] transition-colors"
                >
                  <span>{content.cardCta}</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    ),
    manifesto: (
      <section className="w-full py-16 sm:py-36 bg-white/30 border-t border-b border-[#1b1b1f]/12">
        <div data-reveal className="max-w-[87.5rem] mx-auto px-6 sm:px-12 text-center">
          <div className="font-mono text-xs text-[#283f7d] tracking-[0.25em] uppercase mb-6">
            {content.manifestoEyebrow}
          </div>

          <blockquote className="section-title font-grotesk text-[#1b1b1f] font-medium leading-tight max-w-4xl mx-auto mb-10">
            &ldquo;{content.manifestoQuote}&rdquo;
          </blockquote>

          <div className="font-mono text-xs tracking-widest text-[#5b564a] uppercase">
            {content.manifestoAttribution}
          </div>
        </div>
      </section>
    ),
    approach: (
      <ApproachSection
        eyebrow={content.approachEyebrow}
        title={content.approachTitle}
        intro={content.approachIntro}
        badge={content.approachBadge}
        ctaHref={content.approachCtaHref}
        cards={[
          { name: content.approach1Name, tag: content.approach1Tag, items: content.approach1Items, cta: content.approach1Cta },
          { name: content.approach2Name, tag: content.approach2Tag, items: content.approach2Items, cta: content.approach2Cta },
          { name: content.approach3Name, tag: content.approach3Tag, items: content.approach3Items, cta: content.approach3Cta },
        ]}
      />
    ),
    services: (
      <section className="w-full py-16 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12">
        <div data-reveal className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 sm:mb-20 border-b border-[#1b1b1f]/12 pb-8">
          <div>
            <div className="font-mono text-xs text-[#283f7d] tracking-widest uppercase mb-2">
              {content.servicesEyebrow}
            </div>
            <h2 className="section-title font-grotesk text-[#1b1b1f]">
              {content.servicesTitle}
            </h2>
          </div>
          <p className="font-mono text-xs text-[#6d675b] max-w-xs text-left sm:text-right">
            {content.servicesIntro}
          </p>
        </div>

        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {disciplines.map((d, i) => (
            <div
              key={d.id}
              className="group p-5 sm:p-8 border border-[#1b1b1f]/12 hover:border-[#283f7d] bg-white/35 transition-all duration-300 rounded-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-[#d9ccb0] rounded-sm">
                  <Image
                    src={d.image_url}
                    alt={d.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <span className="font-mono text-xs text-[#283f7d] tracking-widest block mb-2">
                  0{i + 1}
                </span>
                <h3 className="card-title font-grotesk text-[#1b1b1f] mb-2 group-hover:text-[#283f7d] transition-colors">
                  {d.title}
                </h3>
                <p className="text-[#4a463d] text-xs font-normal leading-relaxed">
                  {d.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    team: team.length > 0 && (
        <section className="w-full py-16 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12 border-t border-[#1b1b1f]/12" aria-labelledby="home-team-title">
          <div data-reveal className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 sm:mb-16 pb-8 border-b border-[#1b1b1f]/12">
            <div>
              <div className="font-mono text-xs text-[#283f7d] tracking-widest uppercase mb-2">
                03 • {content.teamEyebrow}
              </div>
              <h2 id="home-team-title" className="section-title font-grotesk text-[#1b1b1f]">
                {content.teamTitle}
              </h2>
            </div>
            {content.teamIntro && (
              <p className="font-mono text-xs text-[#5b564a] max-w-sm text-left sm:text-right leading-relaxed">{content.teamIntro}</p>
            )}
          </div>

          <div data-reveal>
            <TeamPhoto
              photo={teamPhoto}
              photoWidth={teamPhotoSize.width}
              photoHeight={teamPhotoSize.height}
              members={team}
              hint={content.teamPhotoHint}
              touchHint={content.teamPhotoHintTouch}
            />
          </div>

          <div className="mt-12">
            <Link href={content.teamMoreHref || '/about'} className="inline-flex items-center gap-2 font-mono text-xs text-[#3f3b33] hover:text-[#283f7d] transition-colors">
              <span>{content.teamMoreLink}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      ),
    faq: (
      <FaqSection
        eyebrow={content.faqEyebrow}
        title={content.faqTitle}
        intro={content.faqIntro}
        cta={content.faqCta}
        ctaHref={content.faqCtaHref}
        items={[
          { q: content.faq1Q, a: content.faq1A },
          { q: content.faq2Q, a: content.faq2A },
          { q: content.faq3Q, a: content.faq3A },
          { q: content.faq4Q, a: content.faq4A },
          { q: content.faq5Q, a: content.faq5A },
        ]}
      />
    ),
    archive: (
      <section className="w-full py-16 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12 border-t border-[#1b1b1f]/12">
        <div data-reveal className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 pb-8 border-b border-[#1b1b1f]/12">
          <div>
            <div className="font-mono text-xs text-[#283f7d] tracking-widest uppercase mb-2">
              {content.archiveEyebrow}
            </div>
            <h2 className="section-title font-grotesk text-[#1b1b1f]">
              {content.archiveTitle}
            </h2>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 font-mono text-xs text-[#3f3b33] hover:text-[#1b1b1f] transition-colors"
          >
            <span>{fillCount(content.archiveLink, allProjects.length)}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Minimalist Tabular Index */}
        <div data-reveal className="flex flex-col divide-y divide-[#1b1b1f]/12">
          {allProjects.slice(0, 8).map((p, idx) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="group py-6 px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/45 transition-colors"
            >
              <div className="flex items-baseline gap-6">
                <span className="font-mono text-xs text-[#283f7d] tracking-widest">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-xl sm:text-2xl font-grotesk font-medium text-[#1b1b1f] group-hover:text-[#283f7d] transition-colors">
                  {p.title}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-4 text-xs text-[#5b564a] lg:gap-8">
                <span className="hidden w-40 truncate lg:inline-block">{p.typology || 'Architecture'}</span>
                <span className="w-32 truncate">{p.location || 'Iraq'}</span>
                <span className="w-12 shrink-0 lg:w-16">{p.year || '2025'}</span>
                <ArrowUpRight className="w-4 h-4 text-[#8a8473] group-hover:text-[#283f7d] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    ),
  };

  // Every section lives on the cream blueprint sheet. Neighbours are grouped, so the grid, the header
  // colour and the fades behave like one continuous sheet (a hidden section never breaks it).
  const CREAM = new Set<HomeSectionId>(HOME_IDS);
  const order = visibleIds(layout);
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < order.length; ) {
    const first = i;
    if (CREAM.has(order[i])) {
      const group: HomeSectionId[] = [];
      while (i < order.length && CREAM.has(order[i])) group.push(order[i++]);
      blocks.push(
        <BlueprintSheet key={`sheet-${first}`} fadeTop={first > 0} fadeBottom>
          {group.map((id) => (
            <React.Fragment key={id}>{sections[id]}</React.Fragment>
          ))}
        </BlueprintSheet>,
      );
    } else {
      const id = order[i++];
      // a dark section at the very top still has to clear the fixed header
      blocks.push(
        <React.Fragment key={id}>{first === 0 ? <div className="pt-24">{sections[id]}</div> : sections[id]}</React.Fragment>,
      );
    }
  }

  return <div className="on-paper flex flex-col w-full text-[#1b1b1f]">{blocks}</div>;
}
