/**
 * Blog API - GET all posts, POST new post
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Disable caching to always get fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      const posts = await readJsonBlob<BlogPost[]>(CONTENT_KEYS.BLOG, []);
      const isAdmin = await verifyAuth(req);
      
      // If not authenticated, filter out admin-only posts
      if (!isAdmin) {
        const publicPosts = posts.filter(p => !p.adminOnly);
        return res.json(publicPosts);
      }
      
      return res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to read posts' });
    }
  }

  if (req.method === 'POST') {
    const isAdmin = await verifyAuth(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const posts = await readJsonBlob<BlogPost[]>(CONTENT_KEYS.BLOG, []);
      const body = req.body;
      
      const newPost: BlogPost = {
        ...body,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        date: body.date || new Date().toISOString(),
        id: Date.now().toString(),
      };
      
      posts.unshift(newPost);
      await writeJsonBlob(CONTENT_KEYS.BLOG, posts);
      
      return res.json(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
