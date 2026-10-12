'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ProjectRecord } from '@/lib/db/types';
import { Plus, Search, Star, Trash2, Edit3, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function AdminProjectsListPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'featured'>('all');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/admin/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert('Failed to delete project');
    }
  };

  const handleToggleFeatured = async (p: ProjectRecord) => {
    const updatedFeatured = p.is_featured === 1 ? 0 : 1;
    const res = await fetch(`/api/admin/projects/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: updatedFeatured }),
    });

    if (res.ok) {
      setProjects((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_featured: updatedFeatured } : item))
      );
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()) ||
      p.typology?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'published') return p.status_state === 'published';
    if (filter === 'draft') return p.status_state === 'draft';
    if (filter === 'featured') return p.is_featured === 1;
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Architectural Projects ({projects.length})
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            ALL WORKS CATALOGED IN PRODUCTION DATABASE
          </p>
        </div>

        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-skyblue text-black font-mono text-xs font-semibold hover:bg-skyblue-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE PROJECT</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 font-mono text-xs">
        <div className="flex flex-wrap gap-2">
          {(['all', 'published', 'draft', 'featured'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full border transition-colors cursor-pointer capitalize ${
                filter === tab
                  ? 'bg-white text-black border-white font-semibold'
                  : 'text-white/60 border-white/10 hover:border-white/40 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121216] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-skyblue"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="border border-white/10 bg-[#121216] rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-white/40">
            LOADING ATELIER REPOSITORY...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-white/40">
            NO PROJECTS FOUND MATCHING QUERY
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-white/[0.02] text-white/40 border-b border-white/5">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">★</th>
                  <th className="py-3 px-6">TITLE</th>
                  <th className="py-3 px-6">TYPOLOGY</th>
                  <th className="py-3 px-6">LOCATION</th>
                  <th className="py-3 px-6">SCALE</th>
                  <th className="py-3 px-6">STATUS</th>
                  <th className="py-3 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        title={p.is_featured === 1 ? 'Unfeature project' : 'Feature project'}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            p.is_featured === 1
                              ? 'text-sky-400 fill-sky-400'
                              : 'text-white/20 hover:text-white/60'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-6 font-medium text-white">
                      <Link href={`/admin/projects/${p.id}`} className="hover:text-skyblue transition-colors">
                        {p.title}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-white/60">{p.typology || '—'}</td>
                    <td className="py-4 px-6 text-white/60">{p.location || '—'}</td>
                    <td className="py-4 px-6 text-white/60">{p.size || '—'}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status_state}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/projects/${p.slug}`}
                          target="_blank"
                          className="text-white/40 hover:text-white"
                          title="Preview public case study"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/projects/${p.id}`}
                          className="text-skyblue hover:underline font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="text-white/20 hover:text-red-400 transition-colors ml-2 cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
