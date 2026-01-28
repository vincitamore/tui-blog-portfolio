/**
 * Portfolio API - Reorder projects
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, CONTENT_KEYS } from '../_lib/storage.js';
import { verifyAuth } from '../_lib/auth.js';

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  content?: string;  // Full markdown content for detailed view
  technologies: string[];
  github?: string | null;
  link?: string | null;
  image?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isAdmin = await verifyAuth(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { projectIds } = req.body;
    
    if (!Array.isArray(projectIds)) {
      return res.status(400).json({ error: 'projectIds must be an array' });
    }

    const projects = await readJsonBlob<Project[]>(CONTENT_KEYS.PORTFOLIO, []);
    
    // Create a map for quick lookup
    const projectMap = new Map(projects.map(p => [p.id, p]));
    
    // Reorder based on provided IDs
    const reordered = projectIds
      .map(id => projectMap.get(id))
      .filter((p): p is Project => p !== undefined);
    
    // Add any projects that weren't in the list (safety measure)
    const reorderedIds = new Set(projectIds);
    projects.forEach(p => {
      if (!reorderedIds.has(p.id)) {
        reordered.push(p);
      }
    });
    
    await writeJsonBlob(CONTENT_KEYS.PORTFOLIO, reordered);
    
    return res.json(reordered);
  } catch (error) {
    console.error('Error reordering projects:', error);
    return res.status(500).json({ error: 'Failed to reorder projects' });
  }
}
