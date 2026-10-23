'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { MediaAssetRecord } from '@/lib/db/types';
import { Upload, Trash2, Copy, Check, FileText } from 'lucide-react';

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      if (data.success) {
        setAssets(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('altText', files[i].name);

        const res = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setAssets((prev) => [data.data, ...prev]);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    const res = await fetch(`/api/admin/media?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Media Asset Library ({assets.length})
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            LOCAL STORAGE REPOSITORY • HIGH-RESOLUTION ARCHITECTURAL ASSETS
          </p>
        </div>

        <div>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            id="admin-media-upload"
          />
          <label
            htmlFor="admin-media-upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-skyblue text-black font-mono text-xs font-semibold hover:bg-skyblue-light transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'UPLOADING...' : 'UPLOAD MEDIA'}</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center font-mono text-xs text-white/56">
          LOADING ASSET REPOSITORY...
        </div>
      ) : assets.length === 0 ? (
        <div className="p-12 text-center font-mono text-xs text-white/56 border border-white/10 rounded-sm">
          NO MEDIA ASSETS FOUND. UPLOAD YOUR FIRST FILE ABOVE.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assets.map((a) => {
            const isImage = a.mime_type.startsWith('image/');

            return (
              <div
                key={a.id}
                className="group flex flex-col border border-white/10 bg-[#121216] rounded-sm overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-900 flex items-center justify-center">
                  {isImage ? (
                    <Image
                      src={a.url}
                      alt={a.alt_text || a.filename}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-white/56" />
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => copyUrl(a.url, a.id)}
                      className="p-2 rounded-full bg-white text-black hover:bg-skyblue transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === a.id ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 font-mono text-xs text-white/50 flex flex-col gap-0.5">
                  <span className="text-white truncate font-medium">{a.filename}</span>
                  <span className="text-white/56">{Math.round(a.size_bytes / 1024)} KB</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
