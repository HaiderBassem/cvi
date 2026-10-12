import { describe, it, expect, beforeAll } from 'vitest';
import {
  getAllProjects,
  getProjectBySlug,
  getSettings,
  getDisciplines,
  getTeamMembers,
  getNavigationItems,
} from '@/lib/db';

describe('CVI Architects Database Repositories', () => {
  it('loads all 29 seeded architectural projects', () => {
    const projects = getAllProjects({ includeDrafts: true });
    expect(projects.length).toBeGreaterThanOrEqual(25);
  });

  it('retrieves flagship project Budoor Al-Najaf by slug', () => {
    const project = getProjectBySlug('budoor-al-najaf');
    expect(project).not.toBeNull();
    expect(project?.title).toBe('Budoor Al-Najaf');
    expect(project?.location).toContain('Najaf');
    expect(project?.client).toBe('Al-Ghadeer');
    expect(project?.is_featured).toBe(1);
  });

  it('retrieves global studio settings with Baghdad headquarters', () => {
    const settings = getSettings();
    expect(settings.companyName).toBe('CVI Architects');
    expect(settings.email).toBe('info@cvi-iq.com');
    expect(settings.latitude).toBeCloseTo(33.2905, 3);
    expect(settings.longitude).toBeCloseTo(44.3923, 3);
  });

  it('loads all 8 architectural disciplines', () => {
    const disciplines = getDisciplines();
    expect(disciplines.length).toBe(8);
    const titles = disciplines.map((d) => d.title);
    expect(titles).toContain('Architectural Design');
    expect(titles).toContain('BIM & Parametric Modeling');
    expect(titles).toContain('3D Visualization & Simulation');
  });

  it('loads studio leadership team', () => {
    const team = getTeamMembers();
    expect(team.length).toBeGreaterThanOrEqual(4);
    const roles = team.map((t) => t.role);
    expect(roles.some((r) => r.includes('Principal Architect'))).toBe(true);
  });

  it('loads navigation items with correct ordering', () => {
    const nav = getNavigationItems(true);
    expect(nav.length).toBeGreaterThanOrEqual(4);
    expect(nav[0].href).toBe('/');
  });
});
