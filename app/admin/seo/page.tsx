'use client';

import React, { useState, useEffect } from 'react';
import type { GlobalSettings } from '@/lib/db/types';
import { Save, Check, Globe } from 'lucide-react';

export default function AdminSeoPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSettings(d.data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to update SEO');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating SEO');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return <div className="font-mono text-xs text-white/40 p-12">LOADING SEO ATTRIBUTES...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl font-mono text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Search Engine & Social SEO
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            OPEN GRAPH, TWITTER CARDS & METADATA STANDARDS
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-skyblue text-black font-semibold hover:bg-skyblue-light transition-colors cursor-pointer disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-black" />
              <span>SAVED!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'SAVING...' : 'SAVE SEO'}</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="border border-white/10 bg-[#121216] p-8 rounded-sm flex flex-col gap-6">
        <div>
          <label className="block text-white/60 uppercase mb-2">Default Page Title Tag</label>
          <input
            type="text"
            value={settings.defaultSeoTitle}
            onChange={(e) => setSettings({ ...settings, defaultSeoTitle: e.target.value })}
            className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white font-sans focus:outline-none focus:border-skyblue"
          />
        </div>

        <div>
          <label className="block text-white/60 uppercase mb-2">Default Meta Description</label>
          <textarea
            rows={3}
            value={settings.defaultSeoDescription}
            onChange={(e) => setSettings({ ...settings, defaultSeoDescription: e.target.value })}
            className="w-full bg-black/40 border border-white/15 rounded-sm p-4 text-sm text-white font-sans font-light focus:outline-none focus:border-skyblue leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-white/60 uppercase mb-2">Social Sharing Image URL (OpenGraph)</label>
          <input
            type="text"
            value={settings.defaultOgImage}
            onChange={(e) => setSettings({ ...settings, defaultOgImage: e.target.value })}
            className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
          />
        </div>

        {/* Live Search Snippet Preview */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-[10px] text-white/40 tracking-widest uppercase mb-3">
            GOOGLE SEARCH ENGINE SERP PREVIEW
          </div>
          <div className="p-4 bg-black/60 border border-white/10 rounded-sm font-sans">
            <div className="text-xs text-white/50 mb-1 font-mono">https://cvi-arch.com</div>
            <div className="text-base text-blue-400 font-medium hover:underline mb-1">
              {settings.defaultSeoTitle}
            </div>
            <div className="text-xs text-white/70 line-clamp-2 leading-relaxed">
              {settings.defaultSeoDescription}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
