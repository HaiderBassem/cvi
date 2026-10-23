'use client';

import React, { useState, useEffect } from 'react';
import type { GlobalSettings } from '@/lib/db/types';
import { Save, Check } from 'lucide-react';

export default function AdminSettingsPage() {
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

      if (!res.ok) throw new Error('Failed to update settings');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return <div className="font-mono text-xs text-white/56 p-12">LOADING STUDIO SETTINGS...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Global Studio Settings
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            CONTROL IDENTITY, CONTACT COORDINATES & LEGAL ANCHORS
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-skyblue text-black font-mono text-xs font-semibold hover:bg-skyblue-light transition-colors cursor-pointer disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-black" />
              <span>SAVED!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'SAVING...' : 'SAVE SETTINGS'}</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 font-mono text-xs">
        {/* Brand Lockup */}
        <div className="border border-white/10 bg-[#121216] p-8 rounded-sm flex flex-col gap-6">
          <h2 className="text-skyblue tracking-widest uppercase">
            01 • BRAND & STUDIO NOMENCLATURE
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/60 uppercase mb-2">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white font-sans focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block text-white/60 uppercase mb-2">Tagline / Mission</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white font-sans focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/60 uppercase mb-2">Architectural Manifesto / Thesis</label>
            <textarea
              rows={3}
              value={settings.manifesto}
              onChange={(e) => setSettings({ ...settings, manifesto: e.target.value })}
              className="w-full bg-black/40 border border-white/15 rounded-sm p-4 text-sm text-white font-sans font-light focus:outline-none focus:border-skyblue leading-relaxed"
            />
          </div>
        </div>

        {/* Physical Address & Geographic Coordinates */}
        <div className="border border-white/10 bg-[#121216] p-8 rounded-sm flex flex-col gap-6">
          <h2 className="text-skyblue tracking-widest uppercase">
            02 • PHYSICAL LOCATION & BAGHDAD COORDINATES
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/60 uppercase mb-2">Street Address</label>
              <input
                type="text"
                value={settings.addressLine1}
                onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block text-white/60 uppercase mb-2">District / City / Country</label>
              <input
                type="text"
                value={settings.addressLine2}
                onChange={(e) => setSettings({ ...settings, addressLine2: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/60 uppercase mb-2">Latitude Decimal</label>
              <input
                type="number"
                step="any"
                value={settings.latitude}
                onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block text-white/60 uppercase mb-2">Longitude Decimal</label>
              <input
                type="number"
                step="any"
                value={settings.longitude}
                onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>
        </div>

        {/* Direct Channels */}
        <div className="border border-white/10 bg-[#121216] p-8 rounded-sm flex flex-col gap-6">
          <h2 className="text-skyblue tracking-widest uppercase">
            03 • DIRECT COMMUNICATIONS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/60 uppercase mb-2">Telephone / Mobile</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block text-white/60 uppercase mb-2">Studio Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/60 uppercase mb-2">Instagram URL</label>
              <input
                type="text"
                value={settings.instagramUrl}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
              />
            </div>

            <div>
              <label className="block text-white/60 uppercase mb-2">Facebook URL</label>
              <input
                type="text"
                value={settings.facebookUrl}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
