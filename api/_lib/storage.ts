/**
 * Vercel Blob Storage helpers for JSON content
 * Replaces the file-based storage from the VPS deployment
 */

import { put, list, del } from '@vercel/blob';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export interface StorageOptions {
  token?: string;
}

/**
 * Read JSON data from Vercel Blob storage
 */
export async function readJsonBlob<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { blobs } = await list({ prefix: key, token: BLOB_TOKEN });
    
    if (blobs.length === 0) {
      return defaultValue;
    }
    
    const response = await fetch(blobs[0].url);
    if (!response.ok) {
      return defaultValue;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error reading blob ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Write JSON data to Vercel Blob storage
 */
export async function writeJsonBlob(key: string, data: unknown): Promise<void> {
  try {
    // Delete existing blob if it exists
    const { blobs } = await list({ prefix: key, token: BLOB_TOKEN });
    for (const blob of blobs) {
      await del(blob.url, { token: BLOB_TOKEN });
    }
    
    // Write new blob
    await put(key, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      token: BLOB_TOKEN,
    });
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
