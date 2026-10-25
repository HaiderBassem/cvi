import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getSettings, getTeamMembers, getDisciplines, getSiteContent } from '@/lib/db';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Atelier Story & Architectural Philosophy',
  description: 'Learn about CVI Architects, our multidisciplinary team, sustainable philosophy, and architectural commitments in Baghdad and beyond.',
};

export default function AboutPage() {
  const settings = getSettings();
  const team = getTeamMembers(true);
  const disciplines = getDisciplines();
  const content = getSiteContent();
  const pillars = content.pillars;

  return (
    <div className="w-full pt-32 pb-24 text-white">
      {/* Hero Statement */}
      <section className="max-w-[112.5rem] mx-auto px-6 sm:px-12 mb-20 sm:mb-32">
        <div className="font-mono text-xs tracking-widest text-skyblue uppercase mb-4">
          {content.aboutEyebrow}
        </div>
        <h1 className="hero-title font-display max-w-5xl mb-8">
          {content.aboutTitle}
        </h1>
        <p className="editorial-body text-white/88 max-w-3xl font-normal leading-relaxed">
          {content.aboutBody}
        </p>
      </section>

      {/* Main Studio Atelier Image */}
      <section data-reveal className="max-w-[112.5rem] mx-auto px-4 sm:px-8 mb-24 sm:mb-36">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-sm border border-white/10 bg-neutral-900 shadow-2xl">
          <Image
            src={content.aboutImage}
            alt="CVI Architects Atelier"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 font-mono text-xs text-white/88">
            {content.aboutImageCaption}
          </div>
        </div>
      </section>

      {/* Four Studio Pillars */}
      <section className="max-w-[112.5rem] mx-auto px-6 sm:px-12 mb-24 sm:mb-36">
        <div data-reveal className="border-t border-white/10 pt-12 mb-16">
          <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
            {content.pillarsEyebrow}
          </div>
          <h2 className="section-title font-display text-white">
            {content.pillarsTitle}
          </h2>
        </div>

        <div data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, i) => (
            <div key={i} className="flex flex-col border border-white/10 bg-white/[0.01] p-6 rounded-sm">
              <div className="relative aspect-[4/3] overflow-hidden mb-6 bg-neutral-900 rounded-sm">
                <Image
                  src={pillar.img}
                  alt={pillar.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 25vw"
                />
              </div>
              <span className="font-mono text-xs text-skyblue mb-2">0{i + 1}</span>
              <h3 className="card-title text-white font-display mb-3">{pillar.title}</h3>
              <p className="text-white/82 text-xs sm:text-sm font-normal leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8 Core Disciplines */}
      <section className="max-w-[112.5rem] mx-auto px-6 sm:px-12 mb-24 sm:mb-36">
        <div data-reveal className="border-t border-white/10 pt-12 mb-16">
          <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
            {content.aboutServicesEyebrow}
          </div>
          <h2 className="section-title font-display text-white">
            {content.aboutServicesTitle}
          </h2>
        </div>

        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {disciplines.map((d, i) => (
            <div
              key={d.id}
              className="group p-6 border border-white/10 hover:border-skyblue bg-white/[0.01] transition-colors rounded-sm flex flex-col justify-between"
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
                <span className="font-mono text-xs text-white/62 tracking-widest block mb-2">
                  DISCIPLINE #{String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-display font-medium text-white mb-2 group-hover:text-skyblue transition-colors">
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

      {/* Leadership Team */}
      {team.length > 0 && (
      <section className="max-w-[112.5rem] mx-auto px-6 sm:px-12 mb-24 sm:mb-36">
        <div data-reveal className="border-t border-white/10 pt-12 mb-16">
          <div className="font-mono text-xs text-skyblue tracking-widest uppercase mb-2">
            {content.leadershipEyebrow}
          </div>
          <h2 className="section-title font-display text-white">
            {content.leadershipTitle}
          </h2>
        </div>

        <div data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.id} className="flex flex-col border border-white/10 p-6 bg-white/[0.01]">
              <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-neutral-900 rounded-sm">
                <Image
                  src={member.avatar_url}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 25vw"
                />
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-1">
                {member.name}
              </h3>
              <div className="font-mono text-xs text-skyblue mb-3 tracking-wider">
                {member.role}
              </div>
              <p className="text-white/76 text-xs font-normal leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Direct Contact Teaser */}
      <section data-reveal className="max-w-[112.5rem] mx-auto px-6 sm:px-12 text-center py-20 border-t border-white/10">
        <h2 className="section-title font-display text-white mb-6">
          {content.aboutCtaTitle}
        </h2>
        <p className="text-white/82 max-w-xl mx-auto text-base font-normal mb-8">
          {content.aboutCtaBody}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-mono text-xs tracking-widest font-semibold hover:bg-skyblue hover:text-white transition-colors"
        >
          <span>{content.aboutCtaButton}</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
