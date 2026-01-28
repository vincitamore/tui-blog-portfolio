/**
 * Comments API - GET (list) and POST (create) comments for a blog post
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, getCommentsKey, CONTENT_KEYS } from '../_lib/storage.js';

// Comment interface
export interface Comment {
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

// Aggregate metadata for all comments
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

// Banned IP entry
interface BanEntry {
  ip: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
}

// Generate a simple unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Get client IP from request
function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress || 'unknown';
}

// Strip markdown for preview (simple version)
function getPreview(content: string, maxLength = 100): string {
  // Remove markdown syntax for preview
  const stripped = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).trim() + '...';
}

// Update the comments meta file
async function updateCommentsMeta(
  postSlug: string,
  comment: Comment,
  action: 'add' | 'remove'
): Promise<void> {
  const meta = await readJsonBlob<CommentsMeta>(CONTENT_KEYS.COMMENTS_META, {
    totalComments: 0,
    commentsByPost: {},
    recentComments: [],
  });

  if (action === 'add') {
    meta.totalComments++;
    meta.commentsByPost[postSlug] = (meta.commentsByPost[postSlug] || 0) + 1;

    // Add to recent comments (keep last 50)
    meta.recentComments.unshift({
      id: comment.id,
      postSlug: comment.postSlug,
      author: comment.author,
      preview: getPreview(comment.content),
      createdAt: comment.createdAt,
    });
    if (meta.recentComments.length > 50) {
      meta.recentComments = meta.recentComments.slice(0, 50);
    }
  } else if (action === 'remove') {
    meta.totalComments = Math.max(0, meta.totalComments - 1);
    meta.commentsByPost[postSlug] = Math.max(0, (meta.commentsByPost[postSlug] || 1) - 1);
    meta.recentComments = meta.recentComments.filter(c => c.id !== comment.id);
  }

  await writeJsonBlob(CONTENT_KEYS.COMMENTS_META, meta);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug } = req.query;

  if (typeof slug !== 'string' || !slug) {
    return res.status(400).json({ error: 'Invalid post slug' });
  }

  const commentsKey = getCommentsKey(slug);

  // GET - List comments for a post
  if (req.method === 'GET') {
    try {
      const comments = await readJsonBlob<Comment[]>(commentsKey, []);

      // Sort by createdAt chronologically (oldest first for reading order)
      const sorted = [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Strip authorToken and ip from public response
      const publicComments = sorted.map(({ authorToken, ip, ...rest }) => rest);

      return res.json(publicComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  // POST - Create a new comment
  if (req.method === 'POST') {
    const clientIp = getClientIp(req);

    // Check if IP is banned
    try {
      const bannedIps = await readJsonBlob<BanEntry[]>(CONTENT_KEYS.BANNED_IPS, []);
      if (bannedIps.some(entry => entry.ip === clientIp)) {
        return res.status(403).json({ error: 'You are not allowed to comment' });
      }
    } catch {
      // If banned list doesn't exist, continue
    }

    const { content, author, authorToken, parentId } = req.body;

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (!authorToken || typeof authorToken !== 'string') {
      return res.status(400).json({ error: 'Author token is required' });
    }

    // Basic spam prevention: content length limits
    if (content.length > 10000) {
      return res.status(400).json({ error: 'Comment is too long (max 10000 characters)' });
    }

    try {
      const comments = await readJsonBlob<Comment[]>(commentsKey, []);

      const newComment: Comment = {
        id: generateId(),
        postSlug: slug,
        parentId: parentId || null,
        author: (author && typeof author === 'string' && author.trim())
          ? author.trim().substring(0, 50)
          : 'anonymous',
        authorToken: authorToken,
        content: content.trim(),
        ip: clientIp,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        edited: false,
      };

      comments.push(newComment);
      await writeJsonBlob(commentsKey, comments);

      // Update metadata
      await updateCommentsMeta(slug, newComment, 'add');

      // Return comment without sensitive fields
      const { authorToken: _, ip: __, ...publicComment } = newComment;
      return res.status(201).json(publicComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
