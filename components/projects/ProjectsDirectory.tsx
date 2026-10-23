'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProjectRecord } from '@/lib/db/types';
import { ArrowUpRight, Grid, List, Search } from 'lucide-react';

interface ProjectsDirectoryProps {
  initialProjects: ProjectRecord[];
  /** Label of the filter that shows everything. */
  allLabel?: string;
}

const tidy = (t: string) => t.trim().replace(/\s+/g, ' ');

export function ProjectsDirectory({ initialProjects, allLabel = 'All types' }: ProjectsDirectoryProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredProject, setHoveredProject] = useState<ProjectRecord | null>(null);

  // Filters come from the project types that actually exist, so adding a project of a new type
  // (in the admin) adds its filter automatically.
  const filters = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of initialProjects) {
      const t = tidy(p.typology || '');
      if (!t) continue;
      const id = t.toLowerCase();
      if (!seen.has(id)) seen.set(id, t.charAt(0).toUpperCase() + t.slice(1));
    }
    return [{ id: 'all', label: allLabel }, ...[...seen].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))];
  }, [initialProjects, allLabel]);

  const filteredProjects = useMemo(() => {
    return initialProjects.filter((p) => {
      const matchesFilter = activeFilter === 'all' || tidy(p.typology || '').toLowerCase() === activeFilter;

      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.typology?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [initialProjects, activeFilter, searchQuery]);

  return (
    <div className="w-full">
      {/* Filter and View Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-white/10 font-mono text-xs">
        {/* Typology Pills */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full border transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-white text-black border-white font-medium'
                  : 'text-white/76 border-white/10 hover:border-white/40 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Layout Controls */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/62" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-skyblue"
            />
          </div>

          {/* View Toggles */}
          <div className="flex items-center border border-white/10 rounded-full p-1 bg-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
              }`}
              title="Index List View"
              aria-label="Index List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="font-mono text-xs text-white/62 tracking-widest uppercase mb-8">
        SHOWING {filteredProjects.length} OF {initialProjects.length} PORTFOLIO ARCHIVES
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((p, idx) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="group flex flex-col border border-white/10 bg-white/[0.01] hover:border-skyblue transition-colors duration-500 rounded-sm overflow-hidden"
            >
              {/* Media Aspect */}
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                <Image
                  src={p.thumbnail_url || p.hero_image_url || '/baghdad-urban-map.jpg'}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 font-mono text-xs tracking-widest text-white/88 uppercase">
                  #{String(idx + 1).padStart(2, '0')} • {p.typology || 'Architecture'}
                </div>
              </div>

              {/* Text Info */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="card-title text-white font-display mb-2 group-hover:text-skyblue transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-white/76 text-xs font-normal line-clamp-2 leading-relaxed">
                    {p.summary || p.description}
                  </p>
                </div>

                <div className="border-t border-white/10 mt-6 pt-4 flex items-center justify-between font-mono text-[13px] text-white/62">
                  <span>{p.location || 'Iraq'}</span>
                  <span>{p.year || '2025'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List Mode with Hover Floating Image Preview */
        <div className="flex flex-col border-t border-white/10 divide-y divide-white/10">
          {filteredProjects.map((p, idx) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              onMouseEnter={() => setHoveredProject(p)}
              onMouseLeave={() => setHoveredProject(null)}
              className="group py-6 px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-baseline gap-6">
                <span className="font-mono text-xs text-skyblue tracking-widest">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-display font-medium text-white group-hover:text-skyblue transition-colors">
                    {p.title}
                  </h3>
                  <div className="font-mono text-xs text-white/62 mt-1 md:hidden">
                    {p.typology} • {p.location} • {p.year}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-12 font-mono text-xs text-white/70">
                <span className="w-36 truncate">{p.typology || 'Architecture'}</span>
                <span className="w-32">{p.location || 'Iraq'}</span>
                <span className="w-20">{p.year || '2025'}</span>
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/82 group-hover:border-skyblue group-hover:bg-skyblue group-hover:text-black transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
