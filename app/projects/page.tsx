import React from 'react';
import type { Metadata } from 'next';
import { getAllProjects, getSettings } from '@/lib/db';
import { ProjectsDirectory } from '@/components/projects/ProjectsDirectory';

export const metadata: Metadata = {
  title: 'Architecture & Masterplanning Archive',
  description: 'Explore the complete project portfolio of CVI Architects across Iraq, spanning residential towers, educational campuses, cultural centers, and luxury residences.',
};

export default function ProjectsIndexPage() {
  const projects = getAllProjects();
  const settings = getSettings();

  return (
    <div className="w-full pt-32 pb-24 px-6 sm:px-12 max-w-[1800px] mx-auto text-white">
      {/* Editorial Header */}
      <header className="max-w-4xl mb-16 sm:mb-20">
        <div className="font-mono text-xs tracking-widest text-skyblue uppercase mb-4">
          PORTFOLIO ARCHIVE • 2023 — 2026
        </div>
        <h1 className="hero-title font-display text-white mb-6">
          Architectural Works
        </h1>
        <p className="editorial-body text-white/70 max-w-2xl font-light">
          A curated compendium of computational masterplanning, high-density residential towers, educational ecosystems, and tectonic spatial interventions across the Mesopotamian river basin.
        </p>
      </header>

      {/* Interactive Directory */}
      <ProjectsDirectory initialProjects={projects} />
    </div>
  );
}
