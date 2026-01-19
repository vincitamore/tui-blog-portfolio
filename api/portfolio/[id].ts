/**
 * Portfolio API - GET, PUT, DELETE single project by ID
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, CONTENT_KEYS } from '../_lib/storage';
import { verifyAuth } from '../_lib/auth';

interface Project {
  id: string;
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'GET') {
    try {
      const projects = await readJsonBlob<Project[]>(CONTENT_KEYS.PORTFOLIO, []);
      const project = projects.find(p => p.id === id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      return res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      return res.status(500).json({ error: 'Failed to read project' });
    }
  }

  if (req.method === 'PUT') {
    const isAdmin = await verifyAuth(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const projects = await readJsonBlob<Project[]>(CONTENT_KEYS.PORTFOLIO, []);
      const index = projects.findIndex(p => p.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      projects[index] = { ...projects[index], ...req.body };
      await writeJsonBlob(CONTENT_KEYS.PORTFOLIO, projects);
      
      return res.json(projects[index]);
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }
  }

  if (req.method === 'DELETE') {
    const isAdmin = await verifyAuth(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const projects = await readJsonBlob<Project[]>(CONTENT_KEYS.PORTFOLIO, []);
      const filtered = projects.filter(p => p.id !== id);
      await writeJsonBlob(CONTENT_KEYS.PORTFOLIO, filtered);
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
