'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { ProjectRecord, ProjectBlockRecord, BlockType } from '@/lib/db/types';
import {
  ArrowLeft,
  Save,
  ArrowUpRight,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Layers,
  Settings,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

interface ProjectStoryEditorProps {
  initialProject: ProjectRecord;
  initialBlocks: ProjectBlockRecord[];
}

export function ProjectStoryEditor({
  initialProject,
  initialBlocks,
}: ProjectStoryEditorProps) {
  const [project, setProject] = useState<ProjectRecord>(initialProject);
  const [blocks, setBlocks] = useState<ProjectBlockRecord[]>(initialBlocks);
  const [activeTab, setActiveTab] = useState<'parameters' | 'blocks'>('blocks');
  const [customMeta, setCustomMeta] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(initialProject.custom_metadata_json || '{}');
    } catch {
      return {};
    }
  });
  const [newMetaKey, setNewMetaKey] = useState('');
  const [newMetaValue, setNewMetaValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ----------------- BLOCK ACTIONS -----------------

  const addBlock = (type: BlockType) => {
    const newBlock: ProjectBlockRecord = {
      id: 'blk_new_' + Math.random().toString(36).substring(2, 9),
      project_id: project.id,
      block_type: type,
      sort_order: blocks.length,
      is_hidden: 0,
      content_json: JSON.stringify(getDefaultBlockContent(type)),
      created_at: new Date().toISOString(),
    };
    setBlocks([...blocks, newBlock]);
  };

  const getDefaultBlockContent = (type: BlockType): Record<string, any> => {
    switch (type) {
      case 'text':
        return { leadParagraph: 'Enter editorial architectural narrative here...', body: '' };
      case 'heading':
        return { eyebrow: 'SECTION PHASE', title: 'Architectural Articulation', subtitle: '' };
      case 'full_bleed_image':
        return { url: '/baghdad-urban-map.jpg', caption: 'Full-bleed landscape elevation' };
      case 'image':
        return { url: '/baghdad-urban-map.jpg', caption: 'Detailed perspective' };
      case 'two_column':
        return {
          heading: 'Spatial Concept',
          text: 'Detailed environmental rationale...',
          imageUrl: '/baghdad-urban-map.jpg',
          imageCaption: 'Plan axonometric',
          mediaPosition: 'right',
        };
      case 'stats':
        return {
          items: [
            { label: 'Built Area', value: '10,000 m²' },
            { label: 'Completion', value: '2026' },
            { label: 'Scale', value: 'Phase 1' },
          ],
        };
      case 'quote':
        return { quote: 'Architecture is the learned game of masses brought together in light.', author: 'Atelier Lead' };
      case 'before_after':
        return {
          title: 'Solar Illumination Comparison',
          beforeImage: '/baghdad-urban-map.jpg',
          beforeLabel: 'Daylight',
          afterImage: '/baghdad-urban-map.jpg',
          afterLabel: 'Evening',
          initialPosition: 50,
        };
      case 'gallery':
        return {
          title: 'Architectural Renderings',
          images: [{ url: '/baghdad-urban-map.jpg', caption: 'View 1' }],
        };
      case 'spacer':
        return { height: 64, hasDivider: true };
      default:
        return {};
    }
  };

  const updateBlockContent = (blockId: string, updates: Record<string, any>) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        let existing = {};
        try {
          existing = typeof b.content_json === 'string' ? JSON.parse(b.content_json) : b.content_json;
        } catch {}
        return {
          ...b,
          content_json: JSON.stringify({ ...existing, ...updates }),
        };
      })
    );
  };

  const deleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const duplicateBlock = (block: ProjectBlockRecord) => {
    const clone: ProjectBlockRecord = {
      ...block,
      id: 'blk_dup_' + Math.random().toString(36).substring(2, 9),
      sort_order: block.sort_order + 1,
    };
    const index = blocks.findIndex((b) => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, clone);
    setBlocks(newBlocks);
  };

  const toggleHidden = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, is_hidden: b.is_hidden === 1 ? 0 : 1 } : b))
    );
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
  };

  // ----------------- SAVE MASTER MUTATION -----------------

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Update project metadata
      const projRes = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          custom_metadata_json: JSON.stringify(customMeta),
        }),
      });

      if (!projRes.ok) throw new Error('Failed to update project metadata');

      // 2. Save blocks
      const blocksRes = await fetch(`/api/admin/projects/${project.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });

      if (!blocksRes.ok) throw new Error('Failed to save blocks');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/projects"
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-white">
                {project.title}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {project.status_state}
              </span>
            </div>
            <p className="font-mono text-xs text-white/50 mt-0.5">
              SLUG: /projects/{project.slug}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-white text-white/70 hover:text-white font-mono text-xs transition-colors"
          >
            <span>LIVE PREVIEW</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-skyblue text-black font-mono text-xs font-semibold hover:bg-skyblue-light transition-colors cursor-pointer disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>SAVED!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 font-mono text-xs">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'blocks'
              ? 'border-skyblue text-white'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>STORY BLOCKS ({blocks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'parameters'
              ? 'border-skyblue text-white'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>PROJECT PARAMETERS & METADATA</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: STORY BLOCKS BUILDER                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'blocks' && (
        <div className="flex flex-col gap-6">
          {/* Add Block Toolbar */}
          <div className="p-4 border border-white/10 bg-[#121216] rounded-sm flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-white/40 uppercase mr-2 tracking-wider">+ ADD BLOCK:</span>
            {[
              { type: 'text', label: 'Text' },
              { type: 'heading', label: 'Heading' },
              { type: 'full_bleed_image', label: 'Full-Bleed Image' },
              { type: 'image', label: 'Contained Image' },
              { type: 'two_column', label: 'Two-Column Split' },
              { type: 'gallery', label: 'Masonry Gallery' },
              { type: 'before_after', label: 'Before/After Slider' },
              { type: 'stats', label: 'Metric Stats' },
              { type: 'quote', label: 'Quote' },
              { type: 'spacer', label: 'Spacer' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => addBlock(item.type as BlockType)}
                className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:border-skyblue hover:text-skyblue transition-colors cursor-pointer"
              >
                + {item.label}
              </button>
            ))}
          </div>

          {/* Blocks List */}
          <div className="flex flex-col gap-4">
            {blocks.map((b, idx) => {
              let content: Record<string, any> = {};
              try {
                content = typeof b.content_json === 'string' ? JSON.parse(b.content_json) : b.content_json;
              } catch {}

              return (
                <div
                  key={b.id}
                  className={`border rounded-sm transition-all ${
                    b.is_hidden === 1
                      ? 'border-white/5 bg-white/[0.01] opacity-50'
                      : 'border-white/15 bg-[#121216]'
                  }`}
                >
                  {/* Block Header */}
                  <div className="p-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-skyblue font-bold">#{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-medium uppercase text-[10px]">
                        {b.block_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveBlock(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleHidden(b.id)}
                        className="p-1.5 text-white/40 hover:text-white cursor-pointer"
                        title={b.is_hidden === 1 ? 'Show block' : 'Hide block'}
                      >
                        {b.is_hidden === 1 ? <EyeOff className="w-3.5 h-3.5 text-sky-400" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => duplicateBlock(b)}
                        className="p-1.5 text-white/40 hover:text-white cursor-pointer"
                        title="Duplicate block"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBlock(b.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 cursor-pointer ml-1"
                        title="Delete block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Block Field Editor */}
                  <div className="p-6 font-mono text-xs flex flex-col gap-4">
                    {b.block_type === 'text' && (
                      <div>
                        <label className="block text-white/50 uppercase mb-2">Editorial Lead Paragraph</label>
                        <textarea
                          rows={4}
                          value={content.leadParagraph || ''}
                          onChange={(e) => updateBlockContent(b.id, { leadParagraph: e.target.value })}
                          className="w-full bg-black/40 border border-white/15 rounded-sm p-3 text-sm text-white font-sans focus:outline-none focus:border-skyblue"
                        />
                      </div>
                    )}

                    {b.block_type === 'heading' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/50 uppercase mb-2">Eyebrow Tag</label>
                          <input
                            type="text"
                            value={content.eyebrow || ''}
                            onChange={(e) => updateBlockContent(b.id, { eyebrow: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                        <div>
                          <label className="block text-white/50 uppercase mb-2">Heading Title</label>
                          <input
                            type="text"
                            value={content.title || ''}
                            onChange={(e) => updateBlockContent(b.id, { title: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                      </div>
                    )}

                    {(b.block_type === 'full_bleed_image' || b.block_type === 'image') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/50 uppercase mb-2">Image URL</label>
                          <input
                            type="text"
                            value={content.url || ''}
                            onChange={(e) => updateBlockContent(b.id, { url: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                        <div>
                          <label className="block text-white/50 uppercase mb-2">Caption / Architectural Label</label>
                          <input
                            type="text"
                            value={content.caption || ''}
                            onChange={(e) => updateBlockContent(b.id, { caption: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                      </div>
                    )}

                    {b.block_type === 'two_column' && (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white/50 uppercase mb-2">Section Heading</label>
                            <input
                              type="text"
                              value={content.heading || ''}
                              onChange={(e) => updateBlockContent(b.id, { heading: e.target.value })}
                              className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                            />
                          </div>
                          <div>
                            <label className="block text-white/50 uppercase mb-2">Image URL</label>
                            <input
                              type="text"
                              value={content.imageUrl || ''}
                              onChange={(e) => updateBlockContent(b.id, { imageUrl: e.target.value })}
                              className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/50 uppercase mb-2">Narrative Body</label>
                          <textarea
                            rows={3}
                            value={content.text || ''}
                            onChange={(e) => updateBlockContent(b.id, { text: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm p-3 text-white font-sans focus:outline-none focus:border-skyblue"
                          />
                        </div>
                      </div>
                    )}

                    {b.block_type === 'before_after' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/50 uppercase mb-2">Before Image (Left/Top)</label>
                          <input
                            type="text"
                            value={content.beforeImage || ''}
                            onChange={(e) => updateBlockContent(b.id, { beforeImage: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                        <div>
                          <label className="block text-white/50 uppercase mb-2">After Image (Right/Bottom)</label>
                          <input
                            type="text"
                            value={content.afterImage || ''}
                            onChange={(e) => updateBlockContent(b.id, { afterImage: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                      </div>
                    )}

                    {b.block_type === 'quote' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-white/50 uppercase mb-2">Quote Text</label>
                          <input
                            type="text"
                            value={content.quote || ''}
                            onChange={(e) => updateBlockContent(b.id, { quote: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                        <div>
                          <label className="block text-white/50 uppercase mb-2">Author</label>
                          <input
                            type="text"
                            value={content.author || ''}
                            onChange={(e) => updateBlockContent(b.id, { author: e.target.value })}
                            className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-skyblue"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PROJECT PARAMETERS & ARBITRARY METADATA                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'parameters' && (
        <div className="flex flex-col gap-6">
          <div className="border border-white/10 bg-[#121216] p-8 rounded-sm flex flex-col gap-6 font-mono text-xs">
            <h2 className="text-skyblue tracking-widest uppercase">
              GENERAL ARCHITECTURAL ATTRIBUTES
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/50 uppercase mb-2">Project Title</label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => setProject({ ...project, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white font-sans focus:outline-none focus:border-skyblue"
                />
              </div>

              <div>
                <label className="block text-white/50 uppercase mb-2">Slug</label>
                <input
                  type="text"
                  value={project.slug}
                  onChange={(e) => setProject({ ...project, slug: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-skyblue"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-white/50 uppercase mb-2">Typology</label>
                <input
                  type="text"
                  value={project.typology || ''}
                  onChange={(e) => setProject({ ...project, typology: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
                />
              </div>

              <div>
                <label className="block text-white/50 uppercase mb-2">Territory / Location</label>
                <input
                  type="text"
                  value={project.location || ''}
                  onChange={(e) => setProject({ ...project, location: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
                />
              </div>

              <div>
                <label className="block text-white/50 uppercase mb-2">Year</label>
                <input
                  type="text"
                  value={project.year || ''}
                  onChange={(e) => setProject({ ...project, year: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-white/50 uppercase mb-2">Client / Patron</label>
                <input
                  type="text"
                  value={project.client || ''}
                  onChange={(e) => setProject({ ...project, client: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
                />
              </div>

              <div>
                <label className="block text-white/50 uppercase mb-2">Scale / Area</label>
                <input
                  type="text"
                  value={project.size || ''}
                  onChange={(e) => setProject({ ...project, size: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
                />
              </div>

              <div>
                <label className="block text-white/50 uppercase mb-2">Status State</label>
                <select
                  value={project.status_state}
                  onChange={(e) => setProject({ ...project, status_state: e.target.value as any })}
                  className="w-full bg-[#16161b] border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue uppercase"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/50 uppercase mb-2">Hero Image URL</label>
                <input
                  type="text"
                  value={project.hero_image_url || ''}
                  onChange={(e) => setProject({ ...project, hero_image_url: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
                />
              </div>

              <div>
                <label className="block text-white/50 uppercase mb-2">Ambient Theme Background Color</label>
                <input
                  type="text"
                  value={project.theme_bg_color || '#0a0a0c'}
                  onChange={(e) => setProject({ ...project, theme_bg_color: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-skyblue"
                />
              </div>
            </div>
          </div>

          {/* Arbitrary Key-Value Metadata Editor */}
          <div className="border border-white/10 bg-[#121216] p-8 rounded-sm flex flex-col gap-6 font-mono text-xs">
            <h2 className="text-skyblue tracking-widest uppercase">
              ARBITRARY TECHNICAL METADATA (NON-HARDCODED)
            </h2>

            <div className="flex flex-col divide-y divide-white/10">
              {Object.entries(customMeta).map(([k, v]) => (
                <div key={k} className="py-3 flex items-center justify-between gap-4">
                  <span className="text-white/60 font-semibold w-1/3">{k}</span>
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => setCustomMeta({ ...customMeta, [k]: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-sm px-3 py-1.5 text-white"
                  />
                  <button
                    onClick={() => {
                      const updated = { ...customMeta };
                      delete updated[k];
                      setCustomMeta(updated);
                    }}
                    className="text-white/30 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Key-Value */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-white/50 mb-1">New Key Name</label>
                <input
                  type="text"
                  placeholder="e.g. Seismic Resistance Factor"
                  value={newMetaKey}
                  onChange={(e) => setNewMetaKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-white/50 mb-1">Value</label>
                <input
                  type="text"
                  placeholder="e.g. Zone 2B Rated"
                  value={newMetaValue}
                  onChange={(e) => setNewMetaValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newMetaKey.trim()) {
                    setCustomMeta({ ...customMeta, [newMetaKey.trim()]: newMetaValue.trim() });
                    setNewMetaKey('');
                    setNewMetaValue('');
                  }
                }}
                className="px-5 py-2 rounded-full border border-white/20 hover:border-skyblue hover:text-skyblue text-white transition-colors cursor-pointer"
              >
                + ADD KEY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
