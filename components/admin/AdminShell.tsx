'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Image as ImageIcon,
  PanelsTopLeft,
  Users,
  Mail,
  Compass,
  Globe,
  Settings,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { NAV_GROUPS, breadcrumbsFor, isActivePath, pageTitleFor, type NavIconName } from '@/lib/admin/adminNav';
import { AdminLogoutButton } from './AdminLogoutButton';
import { cx } from './ui';

const ICONS: Record<NavIconName, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  projects: FolderKanban,
  media: ImageIcon,
  site: PanelsTopLeft,
  team: Users,
  messages: Mail,
  navigation: Compass,
  seo: Globe,
  settings: Settings,
};

/** Pages fire this after changing a message's status so the sidebar badge stays true. */
export const UNREAD_EVENT = 'cvi:unread';

export function AdminShell({
  name,
  role,
  unread: initialUnread,
  children,
}: {
  name: string;
  role: string;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const crumbs = breadcrumbsFor(pathname);

  useEffect(() => setUnread(initialUnread), [initialUnread]);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.title = `${pageTitleFor(pathname)} · CVI Studio`;
  }, [pathname]);
  useEffect(() => {
    const onUnread = (e: Event) => setUnread((e as CustomEvent<number>).detail);
    window.addEventListener(UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(UNREAD_EVENT, onUnread);
  }, []);

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div className="px-3 mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/35">{group.label}</div>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActivePath(pathname, item.path);
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue',
                      active ? 'bg-white/[0.07] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    {active && <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-skyblue" />}
                    <Icon className={cx('w-4 h-4 shrink-0', active ? 'text-skyblue' : 'text-white/45')} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.icon === 'messages' && unread > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-skyblue text-black text-[11px] font-semibold flex items-center justify-center tabular-nums">
                        <span className="sr-only">{unread} unread</span>
                        <span aria-hidden="true">{unread > 99 ? '99+' : unread}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
      <Link href="/admin" className="min-w-0">
        <div className="font-display font-bold text-sm text-white tracking-wider">CVI STUDIO</div>
        <div className="font-mono text-[9px] text-skyblue tracking-widest uppercase">Content manager</div>
      </Link>
    </div>
  );

  const footer = (
    <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-sm text-white truncate">{name}</div>
        <div className="font-mono text-[10px] text-white/40 uppercase">{role}</div>
      </div>
      <AdminLogoutButton />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white md:flex">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-skyblue focus:text-black focus:px-3 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-white/10 bg-[#0f0f13] md:sticky md:top-0 md:h-screen">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/70" aria-hidden="true" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col bg-[#0f0f13] border-r border-white/10">
            {brand}
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#0b0b0e]/85 backdrop-blur px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 -ml-2 rounded-md text-white/70 hover:text-white hover:bg-white/5"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1.5 text-sm min-w-0">
                {crumbs.map((c, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <li key={i} className="flex items-center gap-1.5 min-w-0">
                      {i > 0 && <ChevronRight aria-hidden="true" className="w-3.5 h-3.5 text-white/25 shrink-0" />}
                      {c.to ? (
                        <Link href={c.to} className="text-white/50 hover:text-white truncate">
                          {c.label}
                        </Link>
                      ) : (
                        <span className={cx('truncate', last ? 'text-white font-medium' : 'text-white/40')} aria-current={last ? 'page' : undefined}>
                          {c.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="shrink-0 inline-flex items-center gap-2 text-xs text-white/60 hover:text-skyblue transition-colors"
          >
            <span className="hidden sm:inline">View site</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only sm:hidden">View site (opens in a new tab)</span>
          </Link>
        </header>

        <main id="admin-main" className="flex-1 px-4 sm:px-8 py-8 sm:py-10 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
