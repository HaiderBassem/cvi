import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProjectBySlug, getAllProjects, getBlocksByProjectId, getSettings } from '@/lib/db';
import { BlockRenderer } from '@/components/projects/BlockRenderer';
import { ProjectMassingViewer } from '@/components/projects/ProjectMassingViewer';
import { placeForLocation } from '@/lib/geo/places';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const settings = getSettings();

  if (!project) {
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
          url: project.hero_image_url || '/baghdad-urban-map.jpg',
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

  if (!project) {
    notFound();
  }

  const blocks = getBlocksByProjectId(project.id);
  const allProjects = getAllProjects();
  const currentIndex = allProjects.findIndex((p) => p.id === project.id);
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length];

  const geoPlace = placeForLocation(project.location);
  const place = geoPlace ? { key: geoPlace.key, name: geoPlace.name, approximate: geoPlace.approximate } : null;

  let customMetadata: Record<string, string> = {};
  try {
    customMetadata = JSON.parse(project.custom_metadata_json || '{}');
  } catch {
    customMetadata = {};
  }

  return (
    <article
      className="relative w-full min-h-screen pt-28 pb-20 text-white transition-colors duration-1000"
      style={{
        backgroundColor: project.theme_bg_color || '#0a0a0c',
      }}
    >
      {/* Top Breadcrumb & Back Action */}
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12 mb-8 flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-white/50 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>ALL ARCHITECTURE</span>
        </Link>

        <div className="font-mono text-xs text-white/40 tracking-widest uppercase">
          INDEX #{String(currentIndex + 1).padStart(2, '0')} / {allProjects.length}
        </div>
      </div>

      {/* Case Study Hero */}
      <header className="max-w-[1800px] mx-auto px-6 sm:px-12 mb-12 sm:mb-16">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 font-mono text-xs tracking-widest text-skyblue uppercase mb-4">
            <span>{project.typology || 'Masterplan'}</span>
            <span>•</span>
            <span>{project.location || 'Iraq'}</span>
            <span>•</span>
            <span>{project.year || '2025'}</span>
          </div>

          <h1 className="hero-title text-white font-display mb-6">
            {project.title}
          </h1>

          {project.subtitle && (
            <p className="text-xl sm:text-2xl text-white/70 font-light max-w-3xl leading-relaxed">
              {project.subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Hero Media Container */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 mb-16">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-sm border border-white/10 bg-neutral-900 shadow-2xl">
          <Image
            src={project.hero_image_url || '/baghdad-urban-map.jpg'}
            alt={project.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      </div>

      {/* Dynamic Metadata Technical Grid */}
      <section className="max-w-[1800px] mx-auto px-6 sm:px-12 mb-16 sm:mb-24">
        <div className="border-t border-b border-white/10 py-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 font-mono">
          <div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">CLIENT</div>
            <div className="text-sm font-medium text-white">{project.client || 'Private'}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">LOCATION</div>
            <div className="text-sm font-medium text-white">{project.location || 'Iraq'}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">YEAR</div>
            <div className="text-sm font-medium text-white">{project.year || '2025'}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">SCALE / AREA</div>
            <div className="text-sm font-medium text-white">{project.size || 'Confidential'}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">PHASE</div>
            <div className="text-sm font-medium text-white">{project.status || 'In Design'}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">TYPOLOGY</div>
            <div className="text-sm font-medium text-white">{project.typology || 'Residential'}</div>
          </div>

          {/* Arbitrary Key/Values */}
          {Object.entries(customMetadata).map(([key, val]) => {
            if (['Client', 'Location', 'Year', 'Scale', 'Status', 'Typology'].includes(key)) return null;
            return (
              <div key={key}>
                <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">{key}</div>
                <div className="text-sm font-medium text-white/80">{val}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3D: real city context from open data + labeled conceptual massing */}
      <section className="max-w-[1800px] mx-auto px-4 sm:px-8 mb-16 sm:mb-24" aria-label="3D site context">
        <div className="px-2 sm:px-4 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="font-mono text-xs tracking-widest text-skyblue uppercase mb-2">3D SITE CONTEXT</div>
            <h2 className="card-title text-white font-display">{place ? `Explore ${place.name} in 3D` : 'Explore the massing'}</h2>
          </div>
          <p className="font-mono text-[11px] text-white/40 tracking-wide max-w-sm sm:text-right">
            {project.typology || 'Architecture'} · {project.location || 'Iraq'}
          </p>
        </div>
        <ProjectMassingViewer slug={project.slug} title={project.title} typology={project.typology} place={place} />
      </section>

      {/* Dynamic Content Blocks */}
      <BlockRenderer blocks={blocks} />

      {/* Cinematic Next Project Portal */}
      {nextProject && (
        <section className="max-w-[1800px] mx-auto px-6 sm:px-12 mt-24 sm:mt-40 border-t border-white/10 pt-16">
          <div className="font-mono text-xs text-white/40 tracking-widest uppercase mb-6">
            CONTINUE EXPLORATION
          </div>
          <Link
            href={`/projects/${nextProject.slug}`}
            className="group relative block w-full overflow-hidden border border-white/10 p-8 sm:p-16 hover:border-skyblue transition-colors duration-500"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 relative z-10">
              <div>
                <span className="font-mono text-xs text-skyblue tracking-widest uppercase block mb-3">
                  NEXT MASTERWORK • {nextProject.typology || 'Architecture'}
                </span>
                <h3 className="section-title text-white font-display group-hover:translate-x-3 transition-transform duration-500">
                  {nextProject.title}
                </h3>
                <p className="text-white/60 font-mono text-xs mt-2">
                  {nextProject.location} • {nextProject.year}
                </p>
              </div>

              <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:border-skyblue group-hover:bg-skyblue group-hover:text-black transition-all duration-300">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            {/* Ambient Background Hover Thumbnail */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
              <Image
                src={nextProject.hero_image_url || '/baghdad-urban-map.jpg'}
                alt={nextProject.title}
                fill
                className="object-cover"
              />
            </div>
          </Link>
        </section>
      )}
    </article>
  );
}
