/**
 * Blog API - GET, PUT, DELETE single post by slug
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, CONTENT_KEYS } from '../_lib/storage.js';
import { verifyAuth } from '../_lib/auth.js';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content?: string;
  tags?: string[];
  adminOnly?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug } = req.query;
  
  if (typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  if (req.method === 'GET') {
    try {
      const posts = await readJsonBlob<BlogPost[]>(CONTENT_KEYS.BLOG, []);
      const post = posts.find(p => p.slug === slug);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Check if admin-only post requires auth
      if (post.adminOnly) {
        const isAdmin = await verifyAuth(req);
        if (!isAdmin) {
          return res.status(404).json({ error: 'Post not found' });
        }
      }
      
      return res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Failed to read post' });
    }
  }

  if (req.method === 'PUT') {
    const isAdmin = await verifyAuth(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const posts = await readJsonBlob<BlogPost[]>(CONTENT_KEYS.BLOG, []);
      const index = posts.findIndex(p => p.slug === slug);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      posts[index] = { ...posts[index], ...req.body };
      await writeJsonBlob(CONTENT_KEYS.BLOG, posts);
      
      return res.json(posts[index]);
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    const isAdmin = await verifyAuth(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const posts = await readJsonBlob<BlogPost[]>(CONTENT_KEYS.BLOG, []);
      const filtered = posts.filter(p => p.slug !== slug);
      await writeJsonBlob(CONTENT_KEYS.BLOG, filtered);
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
