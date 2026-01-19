/**
 * Migration Script: Seed Vercel Blob Storage
 * 
 * This script uploads your local JSON content files to Vercel Blob storage.
 * Run this after setting up your Vercel project to migrate your data.
 * 
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=your_token pnpm run migrate:vercel
 * 
 * Or set BLOB_READ_WRITE_TOKEN in your .env.local file
 */

import { put, list, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required');
  console.error('');
  console.error('Get your token from the Vercel Dashboard:');
  console.error('1. Go to your project → Storage → Your Blob store');
  console.error('2. Copy the BLOB_READ_WRITE_TOKEN');
  console.error('3. Run: BLOB_READ_WRITE_TOKEN=your_token pnpm run migrate:vercel');
  process.exit(1);
}

const CONTENT_FILES = [
  { local: 'blog.json', blob: 'content/blog.json' },
  { local: 'portfolio.json', blob: 'content/portfolio.json' },
  { local: 'admin.json', blob: 'content/admin.json' },
  { local: 'visitors.json', blob: 'content/visitors.json' },
];

async function uploadFile(localPath: string, blobKey: string): Promise<boolean> {
  try {
    const fullPath = path.join(CONTENT_DIR, localPath);
    
    // Check if local file exists
    try {
      await fs.access(fullPath);
    } catch {
      console.log(`⏭️  Skipping ${localPath} (file not found locally)`);
      return false;
    }

    // Read local file
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Validate JSON
    try {
      JSON.parse(content);
    } catch {
      console.error(`❌ Error: ${localPath} is not valid JSON`);
      return false;
    }

    // Delete existing blob if it exists
    const { blobs } = await list({ prefix: blobKey, token: BLOB_TOKEN });
    for (const blob of blobs) {
      await del(blob.url, { token: BLOB_TOKEN });
      console.log(`🗑️  Deleted existing: ${blob.pathname}`);
    }

    // Upload new blob
    const result = await put(blobKey, content, {
      access: 'public',
      contentType: 'application/json',
      token: BLOB_TOKEN,
    });

    console.log(`✅ Uploaded: ${localPath} → ${result.url}`);
    return true;
  } catch (error) {
    console.error(`❌ Error uploading ${localPath}:`, error);
    return false;
  }
}

async function main() {
  console.log('');
  console.log('🚀 Vercel Blob Migration Script');
  console.log('================================');
  console.log(`📁 Content directory: ${CONTENT_DIR}`);
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of CONTENT_FILES) {
    const result = await uploadFile(file.local, file.blob);
    if (result) {
      successCount++;
    } else {
      // Check if it was skipped or errored
      const fullPath = path.join(CONTENT_DIR, file.local);
      try {
        await fs.access(fullPath);
        errorCount++;
      } catch {
        skipCount++;
      }
    }
  }

  console.log('');
  console.log('================================');
  console.log(`✅ Uploaded: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('');

  if (errorCount > 0) {
    process.exit(1);
  }

  console.log('🎉 Migration complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy to Vercel: vercel --prod');
  console.log('2. Test your site at your Vercel URL');
}

main().catch(console.error);
