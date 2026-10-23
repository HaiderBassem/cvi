import React from 'react';
import { notFound } from 'next/navigation';
import { getProjectById, getBlocksByProjectId } from '@/lib/db';
import ProjectEditor from '@/components/admin/ProjectEditor';
import { listModelsWithUsage, listTypologies } from '@/lib/models/usage';

export const dynamic = 'force-dynamic';

interface AdminProjectEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <ProjectEditor
      key={project.id}
      initialProject={project}
      initialBlocks={getBlocksByProjectId(project.id, true)}
      models={listModelsWithUsage()}
      typologies={listTypologies()}
    />
  );
}
