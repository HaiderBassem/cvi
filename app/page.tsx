import React from 'react';
import { getAllProjects, getDisciplines, getPageLayout, getSettings, getSiteContent, getTeamMembers, getTeamPhoto } from '@/lib/db';
import { HomeClient } from '@/components/site/HomeClient';
import { getImageSize } from '@/lib/site/imageSize';

// Read the live database on every request. Pre-building this page would freeze whatever the
// database held at build time, which differs from the server's own data (the mounted volume).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allProjects = getAllProjects();
  const featuredProjects = allProjects.filter((p) => p.is_featured === 1);
  const disciplines = getDisciplines();
  const settings = getSettings();
  const teamPhoto = getTeamPhoto();
  const teamPhotoSize = (await getImageSize(teamPhoto)) ?? { width: 1863, height: 824 };

  return (
    <HomeClient
      featuredProjects={featuredProjects.length > 0 ? featuredProjects : allProjects.slice(0, 6)}
      allProjects={allProjects}
      disciplines={disciplines}
      settings={settings}
      content={getSiteContent()}
      team={getTeamMembers(true)}
      teamPhoto={teamPhoto}
      teamPhotoSize={teamPhotoSize}
      layout={getPageLayout().home}
    />
  );
}
