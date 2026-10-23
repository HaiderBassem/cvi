'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      title="Sign Out"
      className="p-2 text-white/56 hover:text-red-400 transition-colors cursor-pointer"
      aria-label="Sign Out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
