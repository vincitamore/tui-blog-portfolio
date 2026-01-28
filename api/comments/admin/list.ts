/**
 * Admin Comments API - List all comments with full metadata
 * GET: Returns recent comments with IP, grouped by post
 * Requires admin authentication
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';
import { readJsonBlob, CONTENT_KEYS } from '../../_lib/storage.js';
import { verifyAuth } from '../../_lib/auth.js';

interface Comment {
  id: string;
  postSlug: string;
  parentId: string | null;
  author: string;
  authorToken: string;
  content: string;
  ip: string;
  createdAt: string;
  updatedAt: string | null;
  edited: boolean;
}

interface CommentsMeta {
  totalComments: number;
  commentsByPost: Record<string, number>;
  recentComments: Array<{
    id: string;
    postSlug: string;
    author: string;
    preview: string;
    createdAt: string;
  }>;
}

interface AdminLastLogin {
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin auth
  const isAdmin = await verifyAuth(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    // Get comment metadata
    const meta = await readJsonBlob<CommentsMeta>(CONTENT_KEYS.COMMENTS_META, {
      totalComments: 0,
      commentsByPost: {},
      recentComments: [],
    });

    // Get admin last login for "new since" calculation
    const adminData = await readJsonBlob<{ lastLogin?: string }>(CONTENT_KEYS.ADMIN, {});
    const lastLogin = adminData.lastLogin || new Date(0).toISOString();

    // Find all comment blob files
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const { blobs } = await list({ prefix: 'content/comments-', token });

    // Filter to actual comment files (not meta)
    const commentBlobs = blobs.filter(b =>
      b.pathname.startsWith('content/comments-') &&
      !b.pathname.includes('meta')
    );

    // Collect all comments with full data
    const allComments: Comment[] = [];

    for (const blob of commentBlobs) {
      const url = new URL(blob.url);
      url.searchParams.set('_t', Date.now().toString());

      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (response.ok) {
        const comments = await response.json() as Comment[];
        allComments.push(...comments);
      }
    }

    // Sort by createdAt descending (newest first)
    allComments.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Count new comments since last login
    const newCommentsCount = allComments.filter(c =>
      new Date(c.createdAt).getTime() > new Date(lastLogin).getTime()
    ).length;

    // Return all data including sensitive fields
    return res.json({
      totalComments: meta.totalComments,
      commentsByPost: meta.commentsByPost,
      newSinceLastLogin: newCommentsCount,
      lastLogin,
      comments: allComments.slice(0, 100), // Limit to 100 most recent
    });
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
}
