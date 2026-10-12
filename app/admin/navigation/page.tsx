'use client';

import React, { useState, useEffect } from 'react';
import type { NavigationItemRecord } from '@/lib/db/types';
import { Save, Plus, Trash2, Eye, EyeOff, MoveUp, MoveDown, Check } from 'lucide-react';

export default function AdminNavigationPage() {
  const [items, setItems] = useState<NavigationItemRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/navigation')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.data);
      });
  }, []);

  const handleAddItem = () => {
    const newItem: NavigationItemRecord = {
      id: 'nav_' + Math.random().toString(36).substring(2, 8),
      label: 'New Link',
      href: '/new-link',
      sort_order: items.length,
      is_visible: 1,
      is_external: 0,
    };
    setItems([...items, newItem]);
  };

  const handleUpdate = (id: string, updates: Partial<NavigationItemRecord>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to save navigation');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving navigation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Navigation Menu Manager
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            CUSTOMIZE SITE-WIDE HEADER & OVERLAY MENU STRUCTURE
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddItem}
            className="px-4 py-2 rounded-full border border-white/20 hover:border-skyblue text-white font-mono text-xs transition-colors cursor-pointer"
          >
            + ADD ITEM
          </button>
          <button
            onClick={handleSave}
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
                <span>{isSaving ? 'SAVING...' : 'SAVE ORDER'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="border border-white/10 bg-[#121216] rounded-sm divide-y divide-white/10 font-mono text-xs">
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.01]">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-skyblue font-bold">#{idx + 1}</span>
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleUpdate(item.id, { label: e.target.value })}
                className="bg-black/40 border border-white/10 rounded-sm px-3 py-1.5 text-white font-sans text-sm focus:outline-none focus:border-skyblue w-44"
              />
              <input
                type="text"
                value={item.href}
                onChange={(e) => handleUpdate(item.id, { href: e.target.value })}
                className="bg-black/40 border border-white/10 rounded-sm px-3 py-1.5 text-white/80 focus:outline-none focus:border-skyblue flex-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMove(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer"
                title="Move Up"
              >
                <MoveUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMove(idx, 'down')}
                disabled={idx === items.length - 1}
                className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer"
                title="Move Down"
              >
                <MoveDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleUpdate(item.id, { is_visible: item.is_visible === 1 ? 0 : 1 })}
                className="p-1.5 text-white/40 hover:text-white cursor-pointer"
                title={item.is_visible === 1 ? 'Hide item' : 'Show item'}
              >
                {item.is_visible === 1 ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-sky-400" />}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-white/40 hover:text-red-400 cursor-pointer ml-1"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
