'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Check } from 'lucide-react';

export default function AdminNewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [typology, setTypology] = useState('Residential Masterplan');
  const [location, setLocation] = useState('Iraq - Baghdad');
  const [year, setYear] = useState('2026');
  const [client, setClient] = useState('Private Client');
  const [size, setSize] = useState('15,000 m²');
  const [status, setStatus] = useState('Planned');
  const [summary, setSummary] = useState('');
  const [themeBg, setThemeBg] = useState('#0a0a0c');
  const [themeAccent, setThemeAccent] = useState('#4cb8f5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          typology,
          location,
          year,
          client,
          size,
          status,
          summary,
          theme_bg_color: themeBg,
          theme_accent_color: themeAccent,
          status_state: 'published',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      router.push(`/admin/projects/${data.data.id}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error creating project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/projects"
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              Create Architectural Project
            </h1>
            <p className="font-mono text-xs text-white/50">
              COMMISSION NEW MASTERWORK TO DATABASE
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="border border-white/10 bg-[#121216] p-8 rounded-sm flex flex-col gap-6">
          <h2 className="font-mono text-xs tracking-widest text-skyblue uppercase">
            01 • PRIMARY PROJECT PARAMETERS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                Project Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al-Noor Cultural Center"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                URL Slug *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. al-noor-cultural-center"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                Typology
              </label>
              <input
                type="text"
                value={typology}
                onChange={(e) => setTypology(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                Territory / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                Client / Patron
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                Built Scale / Area
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
                Phase / Status
              </label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
              Architectural Summary & Narrative Rationale
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide the primary contextual, environmental, or spatial thesis..."
              className="w-full bg-black/40 border border-white/15 rounded-sm p-4 text-sm text-white focus:outline-none focus:border-skyblue leading-relaxed font-light"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/projects"
            className="px-6 py-3 rounded-full border border-white/20 font-mono text-xs text-white/70 hover:text-white transition-colors"
          >
            CANCEL
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-skyblue text-black font-mono text-xs font-semibold hover:bg-skyblue-light transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'CREATING...' : 'CREATE & BUILD STORY'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
