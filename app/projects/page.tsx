import React from 'react';
import type { Metadata } from 'next';
import { getAllProjects, getSiteContent } from '@/lib/db';
import { ProjectsDirectory } from '@/components/projects/ProjectsDirectory';

export const metadata: Metadata = {
  title: 'Architecture & Masterplanning Archive',
  description: 'Explore the complete project portfolio of CVI Architects across Iraq, spanning residential towers, educational campuses, cultural centers, and luxury residences.',
};

export default function ProjectsIndexPage() {
  const projects = getAllProjects();
  const content = getSiteContent();

  return (
    <div className="w-full pt-32 pb-24 px-6 sm:px-12 max-w-[112.5rem] mx-auto text-white">
      {/* Editorial Header */}
      <header className="max-w-4xl mb-16 sm:mb-20">
        <div className="font-mono text-xs tracking-widest text-skyblue uppercase mb-4">
          {content.projectsEyebrow}
        </div>
        <h1 className="hero-title font-display text-white mb-6">
          {content.projectsTitle}
        </h1>
        <p className="editorial-body text-white/82 max-w-2xl font-normal">
          {content.projectsIntro}
        </p>
      </header>

      {/* Interactive Directory */}
      <ProjectsDirectory initialProjects={projects} allLabel={content.projectsAllLabel} searchPlaceholder={content.projectsSearchPlaceholder} />
    </div>
  );
}
