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

    console.log(`Blob list for ${key}:`, blobs.map(b => b.pathname));

    if (blobs.length === 0) {
      console.log(`No blobs found for key: ${key}, returning default`);
      return defaultValue;
    }

    const response = await fetch(blobs[0].url);
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
 */
export async function writeJsonBlob(key: string, data: unknown): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    throw new Error('Storage not configured: BLOB_READ_WRITE_TOKEN missing');
  }

  try {
    // Delete existing blob if it exists
    const { blobs } = await list({ prefix: key, token });
    for (const blob of blobs) {
      await del(blob.url, { token });
    }

    // Write new blob
    const result = await put(key, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
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
} as const;
