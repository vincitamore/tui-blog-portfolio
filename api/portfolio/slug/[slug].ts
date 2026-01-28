/**
 * Portfolio API - GET single project by slug
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, CONTENT_KEYS } from '../../_lib/storage.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const projects = await readJsonBlob<Project[]>(CONTENT_KEYS.PORTFOLIO, []);
    const project = projects.find(p => p.slug === slug);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ error: 'Failed to read project' });
  }
}
