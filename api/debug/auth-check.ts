/**
 * Debug endpoint - DELETE AFTER DEBUGGING
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';
import { readJsonBlob, CONTENT_KEYS } from '../_lib/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  let blobListResult: unknown = null;
  let blobReadResult: unknown = null;
  let storageResult: unknown = null;
  let error: string | null = null;

  try {
    // Test 1: Direct blob list
    const { blobs } = await list({ prefix: 'content/portfolio', token: blobToken });
    blobListResult = { count: blobs.length, paths: blobs.map(b => b.pathname) };

    // Test 2: Fetch blob content directly
    if (blobs.length > 0) {
      const resp = await fetch(blobs[0].url);
      const data = await resp.json();
      blobReadResult = { projectCount: Array.isArray(data) ? data.length : 'not-array' };
    }

    // Test 3: Use our storage helper
    const projects = await readJsonBlob(CONTENT_KEYS.PORTFOLIO, []);
    storageResult = { projectCount: projects.length };
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  res.json({
    blobToken: { exists: !!blobToken, prefix: blobToken?.slice(0, 25) },
    blobListResult,
    blobReadResult,
    storageResult,
    error,
  });
}
