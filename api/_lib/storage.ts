/**
 * Vercel Blob Storage helpers for JSON content
 * Replaces the file-based storage from the VPS deployment
 */

import { put, list, del } from '@vercel/blob';

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

    console.log(`Blob list for ${key}: ${blobs.length} blob(s)`);

    if (blobs.length === 0) {
      console.log(`No blobs found for key: ${key}, returning default`);
      return defaultValue;
    }

    // Use the most recently uploaded blob (last in list by upload time)
    const latest = blobs.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];

    // Add cache-busting to avoid CDN stale reads
    const response = await fetch(latest.url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
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
 *
 * Write-before-delete: creates the new blob first, then removes old ones.
 * This eliminates the race condition where delete-then-write left a window
 * with no blob (reads returned empty default data).
 *
 * @vercel/blob v2 always adds a random suffix, so each put() creates a
 * new URL. We write first, then delete all blobs except the new one.
 */
export async function writeJsonBlob(key: string, data: unknown): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    throw new Error('Storage not configured: BLOB_READ_WRITE_TOKEN missing');
  }

  try {
    // Write new blob FIRST (always available before deleting old)
    const result = await put(key, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      token,
    });

    console.log(`Wrote blob: ${key} -> ${result.url}`);

    // Now clean up old blobs (new one already exists)
    const { blobs } = await list({ prefix: key, token });
    for (const blob of blobs) {
      if (blob.url !== result.url) {
        await del(blob.url, { token });
        console.log(`Cleaned up old blob: ${blob.pathname}`);
      }
    }
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
} as const;
