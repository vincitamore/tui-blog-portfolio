/**
 * Portfolio API - GET all projects, POST new project
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, CONTENT_KEYS } from '../_lib/storage.js';
import { verifyAuth } from '../_lib/auth.js';

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  github?: string | null;
  link?: string | null;
  image?: string;
}

// Generate URL-friendly slug from title
function generateSlug(title: string, existingSlugs: string[]): string {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Ensure uniqueness
  let uniqueSlug = slug;
  let counter = 1;
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const projects = await readJsonBlob<Project[]>(CONTENT_KEYS.PORTFOLIO, []);
      return res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return res.status(500).json({ error: 'Failed to read projects' });
    }
  }

  if (req.method === 'POST') {
    const isAdmin = await verifyAuth(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const projects = await readJsonBlob<Project[]>(CONTENT_KEYS.PORTFOLIO, []);
      const existingSlugs = projects.map(p => p.slug).filter(Boolean);
      const newProject: Project = {
        ...req.body,
        id: Date.now().toString(),
        slug: req.body.slug || generateSlug(req.body.title, existingSlugs),
      };

      projects.unshift(newProject);
      await writeJsonBlob(CONTENT_KEYS.PORTFOLIO, projects);

      return res.json(newProject);
    } catch (error) {
      console.error('Error creating project:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
