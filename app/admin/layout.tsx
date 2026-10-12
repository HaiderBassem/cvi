import React from 'react';
import { getSession } from '@/lib/auth';
import { getMessageCounts } from '@/lib/db';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Login page (no session): render without the shell.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <AdminShell name={session.name} role={session.role} unread={getMessageCounts().unread}>
      {children}
    </AdminShell>
  );
}
