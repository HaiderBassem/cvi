'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProjectRecord, DisciplineRecord, GlobalSettings, SiteContent, TeamMemberRecord } from '@/lib/db/types';
import { ArrowUpRight, ArrowDown, ChevronRight, Rotate3d, Compass } from 'lucide-react';
import Card3DTilt from '@/components/ui/Card3DTilt';

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
      <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between px-6 sm:px-12 pt-32 pb-12 max-w-[1800px] mx-auto w-full">
        {/* Top CAD Meta Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-mono text-xs text-white/50 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-skyblue">[ CVI ATELIER ]</span>
            <span>BAGHDAD • 33°17&apos;25.9&quot;N 44°23&apos;32.6&quot;E</span>
          </div>
          <div className="flex items-center gap-6">
            <span>DISCIPLINES: ARCHITECTURE • BIM • URBANISM</span>
            <span className="hidden md:inline-block">2026 ARCHIVE</span>
          </div>
        </div>

        {/* Hero Central Statement */}
        <div className="my-auto py-12 max-w-5xl">
          <div className="font-mono text-xs text-skyblue tracking-[0.25em] uppercase mb-6 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-skyblue" />
            <span>{content.heroEyebrow}</span>
          </div>

          <h1 className="hero-title font-display text-white mb-8 tracking-tight">
            {content.heroTitle}{' '}
            {content.heroTitleMuted && <span className="text-white/40 block sm:inline">{content.heroTitleMuted}</span>}
          </h1>

          <p className="editorial-body text-white/80 max-w-2xl font-light leading-relaxed mb-10">
            {content.heroBody}
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs">
            <Link
              href="/projects"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-skyblue hover:text-white transition-colors"
            >
              <span>EXPLORE PORTFOLIO</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/about"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-white/20 hover:border-white text-white/80 hover:text-white transition-colors"
            >
              <span>ATELIER STORY</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-skyblue/30 bg-skyblue/5 text-skyblue text-[11px]">
              <Rotate3d className="w-3.5 h-3.5 animate-spin-slow" />
              <span>REAL 3D CITY · AL-JADRIYA, BAGHDAD</span>
            </div>
          </div>
        </div>

        {/* Bottom Hero HUD */}
        <div className="flex justify-between items-end border-t border-white/10 pt-6 font-mono text-xs text-white/50">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-3.5 h-3.5 animate-bounce text-skyblue" />
            <span className="tracking-widest uppercase">SCROLL FOR MASTERWORKS</span>
          </div>

          <div className="hidden sm:flex gap-8 text-[11px]">
            <div>SCALE: 500,000+ M² MASTERPLANNED</div>
            <div>STATUS: ATELIER ACTIVE</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02 — FLAGSHIP MASTERWORKS (SELECTED PROJECTS)                              */}
      {/* ========================================================================= */}
      <section className="w-full py-24 sm:py-36 max-w-[1800px] mx-auto px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 sm:mb-24 border-b border-white/10 pb-8">
          <div>
            <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
              01 • SELECTED MASTERWORKS
            </div>
            <h2 className="section-title font-display text-white">
              Flagship Interventions
            </h2>
          </div>
          <p className="font-mono text-xs text-white/40 max-w-xs text-left sm:text-right">
            Curated architectural case studies with high-density visual narratives.
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
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/90">
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

                <p className="text-white/70 text-sm sm:text-base font-light leading-relaxed mb-6">
                  {p.summary || p.description}
                </p>

                {/* Technical Metric Row */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-white/10 font-mono text-xs mb-8">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase mb-0.5">BUILT SCALE</span>
                    <span className="text-white font-medium">{p.size || 'Confidential'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase mb-0.5">STATUS PHASE</span>
                    <span className="text-white font-medium">{p.status || 'Active'}</span>
                  </div>
                </div>

                <Link
                  href={`/projects/${p.slug}`}
                  className="inline-flex items-center gap-3 font-mono text-xs text-white tracking-widest group-hover:text-skyblue transition-colors"
                >
                  <span>ENTER CASE STUDY</span>
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
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <div className="font-mono text-xs text-skyblue tracking-[0.25em] uppercase mb-6">
            ATELIER THESIS & COMMITMENT
          </div>

          <blockquote className="section-title font-display text-white font-medium leading-tight max-w-4xl mx-auto mb-10">
            &ldquo;{content.manifestoQuote}&rdquo;
          </blockquote>

          <div className="font-mono text-xs tracking-widest text-white/50 uppercase">
            {content.manifestoAttribution}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04 — INTEGRATED DISCIPLINES                                               */}
      {/* ========================================================================= */}
      <section className="w-full py-24 sm:py-36 max-w-[1800px] mx-auto px-6 sm:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 sm:mb-20 border-b border-white/10 pb-8">
          <div>
            <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
              02 • CORE DISCIPLINES
            </div>
            <h2 className="section-title font-display text-white">
              Spatial Engineering
            </h2>
          </div>
          <p className="font-mono text-xs text-white/40 max-w-xs text-left sm:text-right">
            Full-spectrum architectural delivery from schematic inception to structural coordination.
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
                <span className="font-mono text-[10px] text-skyblue tracking-widest block mb-2">
                  0{i + 1}
                </span>
                <h3 className="card-title font-display text-white mb-2 group-hover:text-skyblue transition-colors">
                  {d.title}
                </h3>
                <p className="text-white/60 text-xs font-light leading-relaxed">
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
        <section className="w-full py-24 sm:py-36 max-w-[1800px] mx-auto px-6 sm:px-12 border-t border-white/10" aria-labelledby="home-team-title">
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
              <p className="font-mono text-xs text-white/50 max-w-sm text-left sm:text-right leading-relaxed">{content.teamIntro}</p>
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
                {m.department && <div className="font-mono text-[11px] text-white/40 mt-0.5">{m.department}</div>}
                {m.bio && <p className="text-white/60 text-sm font-light leading-relaxed mt-3 line-clamp-4">{m.bio}</p>}
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <Link href="/about" className="inline-flex items-center gap-2 font-mono text-xs text-white/70 hover:text-skyblue transition-colors">
              <span>MORE ABOUT THE STUDIO</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 05 — ARCHITECTURAL ARCHIVE (MORE WORKS)                                   */}
      {/* ========================================================================= */}
      <section className="w-full py-24 sm:py-36 max-w-[1800px] mx-auto px-6 sm:px-12 border-t border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16 pb-8 border-b border-white/10">
          <div>
            <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
              04 • ARCHIVAL REPOSITORY
            </div>
            <h2 className="section-title font-display text-white">
              Further Interventions
            </h2>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 font-mono text-xs text-white/70 hover:text-white transition-colors"
          >
            <span>VIEW ALL {allProjects.length} WORKS</span>
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

              <div className="flex items-center gap-8 font-mono text-xs text-white/50">
                <span className="hidden sm:inline-block w-40 truncate">{p.typology || 'Architecture'}</span>
                <span className="w-32">{p.location || 'Iraq'}</span>
                <span className="w-16">{p.year || '2025'}</span>
                <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-skyblue transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06 — ARCHITECTURAL DRAFTING FOOTER                                        */}
      {/* ========================================================================= */}
      <footer className="w-full border-t border-white/15 pt-20 pb-12 bg-[#060608] max-w-[1800px] mx-auto px-6 sm:px-12 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            {/* SVG Logo Mark */}
            <div className="w-44 mb-6">
              <svg viewBox="0 0 248.16 74.16" className="w-full h-auto text-white" fill="currentColor">
                <use href="/cvi-arch-logo.svg#cvi-arch-logo" />
              </svg>
            </div>
            <p className="text-white/60 text-sm font-sans font-light max-w-sm mb-6 leading-relaxed">
              International architectural, computational, and structural practice headquartered in Baghdad, Iraq.
            </p>
            <div className="text-[11px] text-white/40 tracking-wider">
              CAD COORDINATE: 248.16 × 74.16 MM • 33°17&apos;25.9&quot;N 44°23&apos;32.6&quot;E
            </div>
          </div>

          <div>
            <div className="text-white/40 uppercase mb-4 tracking-widest">NAVIGATION</div>
            <ul className="flex flex-col gap-2.5 text-white/80">
              <li><Link href="/" className="hover:text-skyblue transition-colors">Index Overview</Link></li>
              <li><Link href="/projects" className="hover:text-skyblue transition-colors">Architecture Archive</Link></li>
              <li><Link href="/about" className="hover:text-skyblue transition-colors">Studio Philosophy</Link></li>
              <li><Link href="/contact" className="hover:text-skyblue transition-colors">Direct Dialogue</Link></li>
              <li><Link href="/admin" className="hover:text-skyblue transition-colors">Studio CMS Studio</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-white/40 uppercase mb-4 tracking-widest">BAGHDAD ATELIER</div>
            <p className="text-white/70 mb-4 leading-relaxed font-sans text-xs">
              Al-Wuzara Street (Ministers St)<br />
              Al-Jadriya, Baghdad, Iraq
            </p>
            <div className="flex flex-col gap-1 text-white/80">
              <a href={`tel:${settings.phone}`} className="hover:text-skyblue transition-colors">{settings.phone}</a>
              <a href={`mailto:${settings.email}`} className="hover:text-skyblue transition-colors">{settings.email}</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/40 text-[11px]">
          <div>{settings.copyrightText}</div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-white transition-colors cursor-pointer"
          >
            BACK TO ELEVATION TOP ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
