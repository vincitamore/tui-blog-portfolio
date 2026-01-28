/**
 * Comments API - PUT (edit) and DELETE individual comments
 * PUT: Requires authorToken match (user can edit own) or admin auth
 * DELETE: Requires admin auth only
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, getCommentsKey, CONTENT_KEYS } from '../../_lib/storage.js';
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

// Strip markdown for preview
function getPreview(content: string, maxLength = 100): string {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug, id } = req.query;

  if (typeof slug !== 'string' || !slug) {
    return res.status(400).json({ error: 'Invalid post slug' });
  }

  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  const commentsKey = getCommentsKey(slug);

  // PUT - Edit a comment
  if (req.method === 'PUT') {
    const { content, authorToken } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ error: 'Comment is too long (max 10000 characters)' });
    }

    try {
      const comments = await readJsonBlob<Comment[]>(commentsKey, []);
      const commentIndex = comments.findIndex(c => c.id === id);

      if (commentIndex === -1) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      const comment = comments[commentIndex];

      // Check authorization: either matching authorToken or admin
      const isAdmin = await verifyAuth(req);
      const isOwner = authorToken && comment.authorToken === authorToken;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Not authorized to edit this comment' });
      }

      // Update the comment
      comments[commentIndex] = {
        ...comment,
        content: content.trim(),
        updatedAt: new Date().toISOString(),
        edited: true,
      };

      await writeJsonBlob(commentsKey, comments);

      // Update meta preview if needed
      const meta = await readJsonBlob<CommentsMeta>(CONTENT_KEYS.COMMENTS_META, {
        totalComments: 0,
        commentsByPost: {},
        recentComments: [],
      });

      const recentIndex = meta.recentComments.findIndex(c => c.id === id);
      if (recentIndex !== -1) {
        meta.recentComments[recentIndex].preview = getPreview(content.trim());
        await writeJsonBlob(CONTENT_KEYS.COMMENTS_META, meta);
      }

      // Return updated comment without sensitive fields
      const { authorToken: _, ip: __, ...publicComment } = comments[commentIndex];
      return res.json(publicComment);
    } catch (error) {
      console.error('Error updating comment:', error);
      return res.status(500).json({ error: 'Failed to update comment' });
    }
  }

  // DELETE - Remove a comment (admin only)
  if (req.method === 'DELETE') {
    const isAdmin = await verifyAuth(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    try {
      const comments = await readJsonBlob<Comment[]>(commentsKey, []);
      const comment = comments.find(c => c.id === id);

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Remove the comment (and orphan its children - they become root level)
      const filtered = comments.filter(c => c.id !== id);

      // Update children to have null parentId (orphan them)
      filtered.forEach(c => {
        if (c.parentId === id) {
          c.parentId = null;
        }
      });

      await writeJsonBlob(commentsKey, filtered);

      // Update meta
      const meta = await readJsonBlob<CommentsMeta>(CONTENT_KEYS.COMMENTS_META, {
        totalComments: 0,
        commentsByPost: {},
        recentComments: [],
      });

      meta.totalComments = Math.max(0, meta.totalComments - 1);
      meta.commentsByPost[slug] = Math.max(0, (meta.commentsByPost[slug] || 1) - 1);
      meta.recentComments = meta.recentComments.filter(c => c.id !== id);

      await writeJsonBlob(CONTENT_KEYS.COMMENTS_META, meta);

      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
