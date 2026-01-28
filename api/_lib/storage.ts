/**
 * Vercel Blob Storage helpers for JSON content
 * Replaces the file-based storage from the VPS deployment
 */

import { put, list } from '@vercel/blob';

/**
 * Read JSON data from Vercel Blob storage
 */
export async function readJsonBlob<T>(key: string, defaultValue: T): Promise<T> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    throw new Error('Storage not configured: BLOB_READ_WRITE_TOKEN missing');
  }

  try {
    const { blobs } = await list({ prefix: key, token });

    console.log(`Blob list for ${key}:`, blobs.map(b => b.pathname));

    if (blobs.length === 0) {
      console.log(`No blobs found for key: ${key}, returning default`);
      return defaultValue;
    }

    // Sort by uploadedAt descending to get newest blob (handles legacy random-suffix blobs)
    const sortedBlobs = [...blobs].sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    // Add cache-busting query param to bypass CDN cache
    const url = new URL(sortedBlobs[0].url);
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
      return defaultValue;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error reading blob ${key}:`, error);
    throw error; // Re-throw to surface the actual error
  }
}

/**
 * Write JSON data to Vercel Blob storage
 * Uses atomic overwrite - no delete-before-write race condition
 */
export async function writeJsonBlob(key: string, data: unknown): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    throw new Error('Storage not configured: BLOB_READ_WRITE_TOKEN missing');
  }

  try {
    // Atomic overwrite - addRandomSuffix defaults to false in v1.0.0+
    // allowOverwrite enables overwriting existing blob at same path
    const result = await put(key, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      cacheControlMaxAge: 60,
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
    });

    console.log(`Wrote blob: ${key} -> ${result.url}`);
  } catch (error) {
    console.error(`Error writing blob ${key}:`, error);
    throw error;
  }
}

// Content keys
export const CONTENT_KEYS = {
  BLOG: 'content/blog.json',
  PORTFOLIO: 'content/portfolio.json',
  ADMIN: 'content/admin.json',
  VISITORS: 'content/visitors.json',
  COMMENTS_META: 'content/comments-meta.json',
  BANNED_IPS: 'content/banned-ips.json',
} as const;

// Dynamic content key helper for per-post comments
export const getCommentsKey = (postSlug: string) => `content/comments-${postSlug}.json`;
