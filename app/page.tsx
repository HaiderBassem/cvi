import React from 'react';
import { getAllProjects, getDisciplines, getPageLayout, getSettings, getSiteContent, getTeamMembers } from '@/lib/db';
import { HomeClient } from '@/components/site/HomeClient';

export default function HomePage() {
  const allProjects = getAllProjects();
  const featuredProjects = allProjects.filter((p) => p.is_featured === 1);
  const disciplines = getDisciplines();
  const settings = getSettings();

  return (
    <HomeClient
      featuredProjects={featuredProjects.length > 0 ? featuredProjects : allProjects.slice(0, 6)}
      allProjects={allProjects}
      disciplines={disciplines}
      settings={settings}
      content={getSiteContent()}
      team={getTeamMembers(true)}
      layout={getPageLayout().home}
    />
  );
}
