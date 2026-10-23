import React from 'react';
import { preload } from 'react-dom';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProjectBySlug, getAllProjects, getBlocksByProjectId, getSettings, getSiteContent } from '@/lib/db';
import { BlockRenderer } from '@/components/projects/BlockRenderer';
import { ProjectBackdrop } from '@/components/projects/ProjectBackdrop';
import { getModel } from '@/lib/models/catalog';
import { getSession } from '@/lib/auth';
import { ArrowUpRight, ArrowLeft, ArrowDown } from 'lucide-react';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

const FALLBACK_IMAGE = '/baghdad-urban-map.jpg';
const DEFAULT_PAGE_BG = '#0a0a0c';

/** Project theme colours are free text in the admin; only accept real hex values. */
function safeColor(value: string | null | undefined) {
  return value && /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim() : DEFAULT_PAGE_BG;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const settings = getSettings();

  if (!project || (project.status_state !== 'published' && !(await getSession()))) {
    return { title: 'Project Not Found' };
  }

  return {
    title: `${project.title} · ${project.typology || 'Architecture'}`,
    description: project.summary || project.description || settings.defaultSeoDescription,
    openGraph: {
      title: `${project.title} · CVI Architects`,
      description: project.summary || project.description || '',
      images: [
        {
          url: project.hero_image_url || FALLBACK_IMAGE,
          width: 1600,
          height: 900,
          alt: project.title,
        },
      ],
    },
  };
}

export default async function ProjectCaseStudyPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  // Archived and draft projects are not public; a signed-in admin can still preview them.
  if (!project || (project.status_state !== 'published' && !(await getSession()))) {
    notFound();
  }

  const blocks = getBlocksByProjectId(project.id);
  const allProjects = getAllProjects();
  const currentIndex = allProjects.findIndex((p) => p.id === project.id);
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length];

  const info = getModel(project.model_id);
  const model = info ? { id: info.id, label: info.label, bytes: info.bytes, url: info.url } : null;
  // Start downloading this project's model (and only this one) alongside the page itself.
  if (model) preload(model.url, { as: 'fetch', crossOrigin: 'anonymous' });

  const copy = getSiteContent();
  const heroImage = project.hero_image_url || FALLBACK_IMAGE;
  const pageBg = safeColor(project.theme_bg_color);
  const veil = `color-mix(in srgb, ${pageBg} 90%, transparent)`;

  let customMetadata: Record<string, string> = {};
  try {
    customMetadata = JSON.parse(project.custom_metadata_json || '{}');
  } catch {
    customMetadata = {};
  }

  const facts: { label: string; value: string }[] = [
    { label: 'Client', value: project.client || 'Private' },
    { label: 'Location', value: project.location || 'Iraq' },
    { label: 'Year', value: project.year || '2025' },
    { label: 'Scale / Area', value: project.size || 'Confidential' },
    { label: 'Phase', value: project.status || 'In Design' },
    { label: 'Typology', value: project.typology || 'Residential' },
  ];

  return (
    <article className="relative isolate w-full text-white">
      {/* ===================================================================== */}
      {/* HERO — the project's own 3D model is the stage                         */}
      {/* ===================================================================== */}
      <section className="relative flex min-h-[100svh] flex-col justify-between">
        <ProjectBackdrop model={model} poster={heroImage} title={project.title} background={pageBg} />

        {/* Copy sits above the drag surface but lets the pointer through */}
        <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[112.5rem] items-center justify-between px-6 pt-28 sm:px-12">
          <Link
            href="/projects"
            className="pointer-events-auto group inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span>{copy.projectBackLabel}</span>
          </Link>
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {String(currentIndex + 1).padStart(2, '0')} <span className="text-white/40">/ {String(allProjects.length).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="pointer-events-none relative z-10 mx-auto w-full max-w-[112.5rem] px-6 pb-16 pt-16 sm:px-12 sm:pb-20">
          <div className="max-w-4xl">
            <div className="rise eyebrow mb-6 flex-wrap" style={{ ['--d' as string]: '80ms' }}>
              <span>{project.typology || 'Masterplan'}</span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span>{project.location || 'Iraq'}</span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span>{project.year || '2025'}</span>
            </div>

            <h1 className="rise hero-title mb-7 text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.45)]" style={{ ['--d' as string]: '200ms' }}>
              {project.title}
            </h1>

            {project.subtitle && (
              <p className="rise editorial-body max-w-2xl [text-shadow:0_1px_24px_rgba(0,0,0,0.5)]" style={{ ['--d' as string]: '340ms' }}>
                {project.subtitle}
              </p>
            )}

            <div className="rise mt-10 inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-white/70" style={{ ['--d' as string]: '480ms' }}>
              <ArrowDown className="h-4 w-4 animate-bounce text-skyblue" aria-hidden="true" />
              <span>{copy.projectReadCue}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* STORY — the scene settles behind a veil so every line stays readable   */}
      {/* ===================================================================== */}
      <div className="relative z-10">
        <div aria-hidden="true" className="h-40 sm:h-56" style={{ background: `linear-gradient(to bottom, transparent, ${veil})` }} />
        <div className="pb-24" style={{ backgroundColor: veil }}>
          {/* Facts */}
          <section className="mx-auto mb-16 w-full max-w-[112.5rem] px-6 sm:mb-24 sm:px-12" aria-label="Project facts">
            <div className="hairline mb-10" />
            <dl className="grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="mb-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-white/55">{f.label}</dt>
                  <dd className="font-display text-2xl font-medium leading-snug text-white">{f.value}</dd>
                </div>
              ))}
              {Object.entries(customMetadata).map(([key, val]) => {
                if (['Client', 'Location', 'Year', 'Scale', 'Status', 'Typology'].includes(key)) return null;
                return (
                  <div key={key}>
                    <dt className="mb-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-white/55">{key}</dt>
                    <dd className="font-display text-2xl font-medium leading-snug text-white/90">{val}</dd>
                  </div>
                );
              })}
            </dl>
            <div className="hairline mt-10" />
          </section>

          {/* Cover image (the backdrop already uses it when a project has no model) */}
          {model && (
            <div className="mx-auto mb-16 w-full max-w-[112.5rem] px-4 sm:mb-24 sm:px-8">
              <div className="relative aspect-[16/9] overflow-hidden rounded-sm border border-white/10 bg-neutral-900 shadow-2xl sm:aspect-[21/9]">
                <Image src={heroImage} alt={project.title} fill className="object-cover" sizes="100vw" />
              </div>
            </div>
          )}

          {/* Dynamic Content Blocks */}
          <BlockRenderer blocks={blocks} />

          {/* Next project */}
          {nextProject && (
            <section className="mx-auto mt-24 w-full max-w-[112.5rem] px-6 sm:mt-40 sm:px-12">
              <div className="hairline mb-12" />
              <div className="eyebrow mb-8">{copy.projectNextTitle}</div>
              <Link
                href={`/projects/${nextProject.slug}`}
                className="group relative block w-full overflow-hidden border border-white/10 p-8 transition-colors duration-500 hover:border-skyblue sm:p-16"
              >
                <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                  <div>
                    <span className="mb-4 block text-[13px] font-semibold uppercase tracking-[0.18em] text-skyblue">
                      {copy.projectNextLabel} · {nextProject.typology || 'Architecture'}
                    </span>
                    <h3 className="section-title text-white transition-transform duration-500 group-hover:translate-x-3">
                      {nextProject.title}
                    </h3>
                    <p className="mt-3 text-base text-white/70">
                      {nextProject.location} · {nextProject.year}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 text-white transition-all duration-300 group-hover:border-skyblue group-hover:bg-skyblue group-hover:text-black">
                    <ArrowUpRight className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-25">
                  <Image src={nextProject.hero_image_url || FALLBACK_IMAGE} alt="" fill className="object-cover" sizes="100vw" />
                </div>
              </Link>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
