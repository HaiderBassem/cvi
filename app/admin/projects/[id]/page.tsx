import React from 'react';
import { notFound } from 'next/navigation';
import { getProjectById, getBlocksByProjectId } from '@/lib/db';
import { ProjectStoryEditor } from '@/components/admin/ProjectStoryEditor';

interface AdminProjectEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const blocks = getBlocksByProjectId(project.id, true);

  return (
    <ProjectStoryEditor
      initialProject={project}
      initialBlocks={blocks}
    />
  );
}
