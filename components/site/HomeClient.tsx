'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProjectRecord, DisciplineRecord, GlobalSettings, SiteContent, TeamMemberRecord } from '@/lib/db/types';
import { ArrowUpRight, ArrowDown, ChevronRight } from 'lucide-react';
import Card3DTilt from '@/components/ui/Card3DTilt';
import { fillCount } from '@/lib/content/copy';

/** Featured work in an arched frame, slowly cross-fading between projects. */
function HeroShowcase({ projects }: { projects: ProjectRecord[] }) {
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
        <div aria-hidden="true" className="arch-frame absolute -right-4 -top-4 h-full w-full border border-skyblue/40 sm:-right-6 sm:-top-6" />
        <Link
          href={`/projects/${current.slug}`}
          data-cursor="view"
          aria-label={`View ${current.title}`}
          className="arch-frame relative block aspect-[3/3.7] w-full bg-neutral-900 shadow-2xl"
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
          <div className="mb-1 text-[13px] font-semibold uppercase tracking-[0.16em] text-skyblue">Now showing</div>
          <div className="truncate font-display text-2xl font-medium text-white">{current.title}</div>
          <div className="text-sm text-white/70">
            {current.location} · {current.year}
          </div>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Choose featured project">
          {shown.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${p.title}`}
              aria-current={i === index}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${i === index ? 'w-8 bg-skyblue' : 'w-3 bg-white/35 hover:bg-white/60'}`}
            />
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
}

export function HomeClient({
  featuredProjects,
  allProjects,
  disciplines,
  settings,
  content,
  team,
}: HomeClientProps) {
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineRecord | null>(disciplines[0] || null);

  return (
    <div className="flex flex-col w-full text-white">
      {/* ========================================================================= */}
      {/* 01 — HERO EXPERIENCE                                                      */}
      {/* ========================================================================= */}
      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-[112.5rem] flex-col justify-between px-6 pb-10 pt-32 sm:px-12">
        <div className="grid flex-1 grid-cols-1 items-center gap-14 py-10 lg:grid-cols-12 lg:gap-10">
          {/* Statement */}
          <div className="lg:col-span-7">
            <div className="rise eyebrow mb-8" style={{ ['--d' as string]: '60ms' }}>
              <span>{content.heroEyebrow || 'CVI Architects · Baghdad'}</span>
            </div>

            <h1 className="rise hero-title mb-8 text-white" style={{ ['--d' as string]: '180ms' }}>
              {content.heroTitle}{' '}
              {content.heroTitleMuted && <span className="display-italic block sm:inline">{content.heroTitleMuted}</span>}
            </h1>

            <p className="rise editorial-body mb-11 max-w-2xl" style={{ ['--d' as string]: '320ms' }}>
              {content.heroBody}
            </p>

            <div className="rise flex flex-wrap items-center gap-4" style={{ ['--d' as string]: '460ms' }}>
              <Link
                href="/projects"
                className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-black transition-colors hover:bg-skyblue"
              >
                <span>{content.heroPrimaryCta}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-3 rounded-full border border-white/30 px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white/5"
              >
                <span>{content.heroSecondaryCta}</span>
              </Link>
            </div>
          </div>

          {/* Featured work, framed in an arch */}
          <div className="rise lg:col-span-5" style={{ ['--d' as string]: '300ms' }}>
            <HeroShowcase projects={featuredProjects} />
          </div>
        </div>

        {/* Facts */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-7 sm:grid-cols-4">
          {content.heroStats.map((st, i) => (
            <div key={i}>
              <div className="font-display text-4xl font-medium leading-none text-white sm:text-5xl">{fillCount(st.value, allProjects.length)}</div>
              <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/70">{fillCount(st.label, allProjects.length)}</div>
            </div>
          ))}
          <div className="flex items-end">
            <span className="inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/70">
              <ArrowDown className="h-4 w-4 animate-bounce text-skyblue" aria-hidden="true" />
              {content.heroScrollCue}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02 — FLAGSHIP MASTERWORKS (SELECTED PROJECTS)                              */}
      {/* ========================================================================= */}
      <section className="w-full py-24 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 sm:mb-24 border-b border-white/10 pb-8">
          <div>
            <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
              {content.featuredEyebrow}
            </div>
            <h2 className="section-title font-display text-white">
              {content.featuredTitle}
            </h2>
          </div>
          <p className="font-mono text-xs text-white/62 max-w-xs text-left sm:text-right">
            {content.featuredIntro}
          </p>
        </div>

        {/* Vertical Chapter Portals */}
        <div className="flex flex-col gap-24 sm:gap-40">
          {featuredProjects.map((p, idx) => (
            <article
              key={p.id}
              className="group relative flex flex-col lg:flex-row gap-10 lg:gap-16 items-start lg:items-center"
            >
              {/* Media Portal (Left on even, Right on odd) with 3D Perspective Tilt */}
              <div className={`w-full lg:w-7/12 ${idx % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                <Card3DTilt maxTilt={6} scale={1.015} className="w-full">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10 bg-neutral-900 shadow-2xl">
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
                <div className="flex items-center gap-3 font-mono text-xs text-skyblue mb-3 tracking-widest uppercase">
                  <span>{p.location || 'Iraq'}</span>
                  <span>•</span>
                  <span>{p.year || '2025'}</span>
                </div>

                <h3 className="card-title font-display text-white mb-4 group-hover:text-skyblue transition-colors">
                  <Link href={`/projects/${p.slug}`}>
                    {p.title}
                  </Link>
                </h3>

                <p className="text-white/82 text-sm sm:text-base font-normal leading-relaxed mb-6">
                  {p.summary || p.description}
                </p>

                {/* Technical Metric Row */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-white/10 font-mono text-xs mb-8">
                  <div>
                    <span className="text-white/62 block text-xs uppercase mb-0.5">{content.cardScaleLabel}</span>
                    <span className="text-white font-medium">{p.size || 'Confidential'}</span>
                  </div>
                  <div>
                    <span className="text-white/62 block text-xs uppercase mb-0.5">{content.cardPhaseLabel}</span>
                    <span className="text-white font-medium">{p.status || 'Active'}</span>
                  </div>
                </div>

                <Link
                  href={`/projects/${p.slug}`}
                  className="inline-flex items-center gap-3 font-mono text-xs text-white tracking-widest group-hover:text-skyblue transition-colors"
                >
                  <span>{content.cardCta}</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 03 — STUDIO MANIFESTO                                                     */}
      {/* ========================================================================= */}
      <section className="w-full py-24 sm:py-36 bg-[#060608] border-t border-b border-white/10">
        <div className="max-w-[87.5rem] mx-auto px-6 sm:px-12 text-center">
          <div className="font-mono text-xs text-skyblue tracking-[0.25em] uppercase mb-6">
            {content.manifestoEyebrow}
          </div>

          <blockquote className="section-title font-display text-white font-medium leading-tight max-w-4xl mx-auto mb-10">
            &ldquo;{content.manifestoQuote}&rdquo;
          </blockquote>

          <div className="font-mono text-xs tracking-widest text-white/70 uppercase">
            {content.manifestoAttribution}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04 — INTEGRATED DISCIPLINES                                               */}
      {/* ========================================================================= */}
      <section className="w-full py-24 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 sm:mb-20 border-b border-white/10 pb-8">
          <div>
            <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
              {content.servicesEyebrow}
            </div>
            <h2 className="section-title font-display text-white">
              {content.servicesTitle}
            </h2>
          </div>
          <p className="font-mono text-xs text-white/62 max-w-xs text-left sm:text-right">
            {content.servicesIntro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {disciplines.map((d, i) => (
            <div
              key={d.id}
              className="group p-8 border border-white/10 hover:border-skyblue bg-white/[0.01] transition-all duration-300 rounded-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-neutral-900 rounded-sm">
                  <Image
                    src={d.image_url}
                    alt={d.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <span className="font-mono text-xs text-skyblue tracking-widest block mb-2">
                  0{i + 1}
                </span>
                <h3 className="card-title font-display text-white mb-2 group-hover:text-skyblue transition-colors">
                  {d.title}
                </h3>
                <p className="text-white/76 text-xs font-normal leading-relaxed">
                  {d.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04b — STUDIO TEAM                                                         */}
      {/* ========================================================================= */}
      {team.length > 0 && (
        <section className="w-full py-24 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12 border-t border-white/10" aria-labelledby="home-team-title">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 sm:mb-16 pb-8 border-b border-white/10">
            <div>
              <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
                03 • {content.teamEyebrow}
              </div>
              <h2 id="home-team-title" className="section-title font-display text-white">
                {content.teamTitle}
              </h2>
            </div>
            {content.teamIntro && (
              <p className="font-mono text-xs text-white/70 max-w-sm text-left sm:text-right leading-relaxed">{content.teamIntro}</p>
            )}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m) => (
              <li key={m.id} className="group flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-white/10 bg-neutral-900 mb-5">
                  <Image
                    src={m.avatar_url}
                    alt={`Portrait of ${m.name}`}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <h3 className="text-xl font-display font-semibold text-white">{m.name}</h3>
                <div className="font-mono text-xs text-skyblue mt-1 tracking-wider">{m.role}</div>
                {m.department && <div className="font-mono text-[13px] text-white/62 mt-0.5">{m.department}</div>}
                {m.bio && <p className="text-white/76 text-sm font-normal leading-relaxed mt-3 line-clamp-4">{m.bio}</p>}
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <Link href="/about" className="inline-flex items-center gap-2 font-mono text-xs text-white/82 hover:text-skyblue transition-colors">
              <span>More about us</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 05 — ARCHITECTURAL ARCHIVE (MORE WORKS)                                   */}
      {/* ========================================================================= */}
      <section className="w-full py-24 sm:py-36 max-w-[112.5rem] mx-auto px-6 sm:px-12 border-t border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 pb-8 border-b border-white/10">
          <div>
            <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
              {content.archiveEyebrow}
            </div>
            <h2 className="section-title font-display text-white">
              {content.archiveTitle}
            </h2>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 font-mono text-xs text-white/82 hover:text-white transition-colors"
          >
            <span>{fillCount(content.archiveLink, allProjects.length)}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Minimalist Tabular Index */}
        <div className="flex flex-col divide-y divide-white/10">
          {allProjects.slice(0, 8).map((p, idx) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="group py-6 px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-baseline gap-6">
                <span className="font-mono text-xs text-skyblue tracking-widest">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-xl sm:text-2xl font-display font-medium text-white group-hover:text-skyblue transition-colors">
                  {p.title}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-4 text-xs text-white/70 lg:gap-8">
                <span className="hidden w-40 truncate lg:inline-block">{p.typology || 'Architecture'}</span>
                <span className="w-32 truncate">{p.location || 'Iraq'}</span>
                <span className="w-12 shrink-0 lg:w-16">{p.year || '2025'}</span>
                <ArrowUpRight className="w-4 h-4 text-white/55 group-hover:text-skyblue transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
