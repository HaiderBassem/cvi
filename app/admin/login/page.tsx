'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col justify-center items-center p-6 relative">
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="w-full max-w-md bg-[#121216] border border-white/10 rounded-sm p-8 sm:p-12 shadow-2xl relative z-10">
        {/* Header Lockup */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-skyblue/10 border border-skyblue/30 flex items-center justify-center text-skyblue">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-semibold text-lg text-white">
              CVI STUDIO CMS
            </div>
            <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
              Authenticated Session Guard
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-sm text-xs font-mono text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-skyblue"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-white/60 mb-2 uppercase">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-sm px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-skyblue"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-white text-black font-mono text-xs tracking-widest font-semibold hover:bg-skyblue hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'AUTHENTICATING...' : 'ENTER STUDIO'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-2.5 text-[11px] font-mono text-white/40">
          <ShieldCheck className="w-4 h-4 text-skyblue flex-shrink-0 mt-0.5" />
          <span>
            Studio administrative console. Authorized personnel only. Contact system administrator for credentials.
          </span>
        </div>
      </div>
    </div>
  );
}
