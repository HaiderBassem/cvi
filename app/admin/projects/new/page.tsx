import React from 'react';
import ProjectEditor from '@/components/admin/ProjectEditor';
import { listModelsWithUsage, listTypologies } from '@/lib/models/usage';

export const dynamic = 'force-dynamic';

export default function AdminNewProjectPage() {
  return <ProjectEditor initialProject={null} initialBlocks={[]} models={listModelsWithUsage()} typologies={listTypologies()} />;
}
