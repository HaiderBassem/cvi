import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderKanban,
  Image as ImageIcon,
  Users,
  Mail,
  Plus,
  PanelsTopLeft,
  ArrowRight,
  Inbox,
  CheckCircle2,
  Circle,
  Pencil,
} from 'lucide-react';
import { getAllProjects, getMediaAssets, getTeamMembers, getMessageCounts, getContactMessages, getSettings, getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({
  href,
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-white/10 bg-[#111116] p-4 sm:p-5 hover:border-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-skyblue"
    >
      <div className="flex items-center justify-between text-white/45">
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
        <span className="text-skyblue" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-display font-bold text-white tabular-nums">{value}</div>
      <div className={`mt-1 text-xs ${highlight ? 'text-skyblue' : 'text-white/45'}`}>{hint}</div>
    </Link>
  );
}

export default function AdminOverviewPage() {
  const projects = getAllProjects({ includeDrafts: true });
  const published = projects.filter((p) => p.status_state === 'published').length;
  const featured = projects.filter((p) => p.is_featured === 1).length;
  const media = getMediaAssets();
  const team = getTeamMembers();
  const visibleTeam = team.filter((t) => t.is_visible !== 0).length;
  const counts = getMessageCounts();
  const recentMessages = getContactMessages('inbox').slice(0, 5);
  const recentProjects = [...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);
  const settings = getSettings();

  const siteContentEdited = Boolean(getDb().prepare("SELECT 1 FROM global_settings WHERE key = 'site_content'").get());
  const missingHero = projects.filter((p) => !p.hero_image_url).length;

  const checklist = [
    { done: team.length > 0, label: 'Add the studio team', href: '/admin/team' },
    { done: siteContentEdited, label: 'Review homepage & about texts', href: '/admin/site' },
    {
      done: missingHero === 0,
      label: missingHero ? `${missingHero} projects need a hero image` : 'Every project has a hero image',
      href: '/admin/projects',
    },
    { done: Boolean(settings.email && settings.phone), label: 'Studio email & phone are set', href: '/admin/settings' },
  ];
  const remaining = checklist.filter((c) => !c.done).length;

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Overview</h1>
          <p className="mt-1 text-sm text-white/55">{today}. Here&apos;s what needs you next.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-skyblue text-black text-sm font-semibold hover:bg-skyblue-light transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> New project
          </Link>
          <Link
            href="/admin/team"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-white text-sm hover:bg-white/[0.08] transition-colors"
          >
            <Users className="w-4 h-4" aria-hidden="true" /> Add team member
          </Link>
          <Link
            href="/admin/site"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-white text-sm hover:bg-white/[0.08] transition-colors"
          >
            <PanelsTopLeft className="w-4 h-4" aria-hidden="true" /> Edit site texts
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          href="/admin/projects"
          icon={<FolderKanban className="w-4 h-4" />}
          label="Projects"
          value={projects.length}
          hint={`${published} published · ${featured} featured`}
        />
        <StatCard
          href="/admin/messages"
          icon={<Mail className="w-4 h-4" />}
          label="Messages"
          value={counts.total - counts.archived}
          hint={counts.unread > 0 ? `${counts.unread} new` : 'Nothing new'}
          highlight={counts.unread > 0}
        />
        <StatCard href="/admin/team" icon={<Users className="w-4 h-4" />} label="Team" value={team.length} hint={`${visibleTeam} shown on the site`} />
        <StatCard href="/admin/media" icon={<ImageIcon className="w-4 h-4" />} label="Media" value={media.length} hint="Images in the library" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent messages */}
        <section className="lg:col-span-2 rounded-lg border border-white/10 bg-[#111116]" aria-labelledby="recent-messages">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
            <h2 id="recent-messages" className="text-sm font-semibold text-white">
              Recent messages
            </h2>
            <Link href="/admin/messages" className="text-xs text-white/55 hover:text-skyblue inline-flex items-center gap-1">
              Open inbox <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Inbox className="w-6 h-6 mx-auto mb-3 text-white/35" aria-hidden="true" />
              <p className="text-sm font-medium text-white">No messages yet</p>
              <p className="mt-1 text-sm text-white/50">Briefs sent from the contact page appear here.</p>
            </div>
          ) : (
            <ul>
              {recentMessages.map((m, i) => (
                <li key={m.id} className={i < recentMessages.length - 1 ? 'border-b border-white/5' : ''}>
                  <Link
                    href={`/admin/messages?open=${m.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-skyblue"
                  >
                    <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'new' ? 'bg-skyblue' : 'bg-transparent'}`} />
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm truncate ${m.status === 'new' ? 'text-white font-semibold' : 'text-white/80'}`}>
                        {m.name}
                        {m.status === 'new' && <span className="sr-only"> (new)</span>}
                      </span>
                      <span className="block text-xs text-white/45 truncate">{m.message}</span>
                    </span>
                    <time dateTime={m.created_at} className="text-xs text-white/40 shrink-0">
                      {timeAgo(m.created_at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Setup checklist */}
        <section className="rounded-lg border border-white/10 bg-[#111116]" aria-labelledby="checklist">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 id="checklist" className="text-sm font-semibold text-white">
              Before you share the site
            </h2>
            <p className="text-xs text-white/45 mt-0.5">{remaining === 0 ? 'All set.' : `${remaining} of ${checklist.length} left`}</p>
          </div>
          <ul className="p-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/[0.04] text-sm">
                  {c.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Done" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/30 shrink-0" aria-label="To do" />
                  )}
                  <span className={c.done ? 'text-white/50' : 'text-white'}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Recently edited projects */}
      <section className="rounded-lg border border-white/10 bg-[#111116]" aria-labelledby="recent-projects">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <h2 id="recent-projects" className="text-sm font-semibold text-white">
            Recently edited projects
          </h2>
          <Link href="/admin/projects" className="text-xs text-white/55 hover:text-skyblue inline-flex items-center gap-1">
            All projects <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        <ul className="divide-y divide-white/5">
          {recentProjects.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3">
              <div className="relative w-16 aspect-[4/3] rounded overflow-hidden bg-white/5 shrink-0">
                {p.thumbnail_url || p.hero_image_url ? (
                  <Image src={(p.thumbnail_url || p.hero_image_url)!} alt="" fill className="object-cover" sizes="64px" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{p.title}</div>
                <div className="text-xs text-white/45 truncate">
                  {p.typology || 'Architecture'} · {p.location || 'Iraq'} · edited {timeAgo(p.updated_at)}
                </div>
              </div>
              <span
                className={`hidden sm:inline-flex px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wider ${
                  p.status_state === 'published'
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : 'border-white/15 bg-white/[0.04] text-white/60'
                }`}
              >
                {p.status_state}
              </span>
              <Link
                href={`/admin/projects/${p.id}`}
                aria-label={`Edit ${p.title}`}
                className="p-2 rounded-full text-white/55 hover:text-white hover:bg-white/[0.06]"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
