# Vercel Migration Documentation

This document outlines all changes made to migrate the TUI Blog Portfolio from a Hetzner VPS to Vercel. The original VPS deployment files remain intact in `deploy/` for easy rollback.

## Overview

**Previous Architecture (VPS):**
- Express.js API server running on port 3001
- Nginx reverse proxy with SSL
- JSON files stored in `/content` directory on disk
- PM2 for process management
- In-memory session storage

**New Architecture (Vercel):**
- Vercel Serverless Functions for API routes
- Vercel Blob for JSON content storage
- Vercel KV (Upstash Redis) for session storage
- Static frontend deployed to Vercel CDN

---

## Files Added for Vercel

### Configuration

- `vercel.json` - Vercel deployment configuration

**Current vercel.json:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

> **Important:** Use `rewrites` (not `routes`) to avoid breaking dynamic API routes like `[id].ts`. The rewrite pattern `/((?!api/).*)` sends all non-API routes to the SPA while letting Vercel handle `/api/*` routing automatically.

### API Functions (Serverless)

All API routes are in the `/api` directory:

```
api/
├── _lib/
│   ├── auth.ts       # Authentication helpers (session management via Vercel KV)
│   └── storage.ts    # Blob storage helpers (replaces file-based JSON storage)
├── admin/
│   ├── login.ts      # POST /api/admin/login
│   ├── logout.ts     # POST /api/admin/logout
│   ├── password.ts   # PUT /api/admin/password
│   └── verify.ts     # GET /api/admin/verify
├── blog/
│   ├── index.ts      # GET /api/blog, POST /api/blog
│   └── [slug].ts     # GET/PUT/DELETE /api/blog/:slug
├── portfolio/
│   ├── index.ts      # GET /api/portfolio, POST /api/portfolio
│   ├── [id].ts       # GET/PUT/DELETE /api/portfolio/:id
│   └── reorder.ts    # POST /api/portfolio/reorder
├── visit.ts          # POST /api/visit (visitor logging)
├── visitors.ts       # GET /api/visitors (admin only)
└── whoami.ts         # GET /api/whoami (IP lookup)
```

### Critical: ESM Import Extensions

All imports between API files **must use `.js` extensions** for Node.js ESM compatibility:

```typescript
// ✅ Correct
import { readJsonBlob } from '../_lib/storage.js';
import { verifyAuth } from '../_lib/auth.js';

// ❌ Wrong - will fail with ERR_MODULE_NOT_FOUND
import { readJsonBlob } from '../_lib/storage';
```

### Dependencies Added

```json
{
  "@vercel/blob": "^2.0.0",
  "@vercel/kv": "^3.0.0",
  "@vercel/node": "^5.5.23"
}
```

### Scripts Added

```json
{
  "migrate:vercel": "tsx scripts/seed-vercel-blob.ts"
}
```

---

## Environment Variables Required on Vercel

These are **auto-generated** when you create storage resources through Vercel Dashboard:

| Variable | Description | Source |
|----------|-------------|--------|
| `BLOB_READ_WRITE_TOKEN` | Token for Vercel Blob storage | Blob store creation |
| `KV_REST_API_URL` | Vercel KV REST API URL | KV store creation |
| `KV_REST_API_TOKEN` | Vercel KV REST API token | KV store creation |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV read-only token | KV store creation |
| `KV_URL` | Redis URL (not used by @vercel/kv) | KV store creation |

> **Important:** You MUST use **Vercel's native KV** (powered by Upstash), NOT external Redis services like Redis Labs. The `@vercel/kv` package requires the REST API endpoints, not raw Redis protocol URLs.

---

## Deployment Steps

### 1. Connect to Vercel

Via GitHub integration (recommended):
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `vincitamore/tui-blog-portfolio`
3. Vercel auto-detects Vite and configures build

Or via CLI:
```bash
npm install -g vercel
vercel login
vercel link
```

### 2. Create Storage Resources

In the Vercel Dashboard → Your Project → **Storage**:

1. **Create Blob Store**: 
   - Click "Create Database" → "Blob"
   - Name it (e.g., "tui-blog-content")
   - Environment variables auto-added

2. **Create KV Store** (for sessions):
   - Click "Create Database" → "KV" 
   - Name it (e.g., "tui-blog-sessions")
   - Environment variables auto-added
   - **Must be Vercel's native KV, not Redis Labs**

### 3. Migrate Content Data

Set the blob token locally and run migration:

```powershell
# PowerShell
$env:BLOB_READ_WRITE_TOKEN="your_token_from_vercel_dashboard"
pnpm run migrate:vercel
```

```bash
# Bash
BLOB_READ_WRITE_TOKEN=your_token_from_vercel_dashboard pnpm run migrate:vercel
```

This uploads:
- `content/blog.json` → Vercel Blob
- `content/portfolio.json` → Vercel Blob
- `content/admin.json` → Vercel Blob
- `content/visitors.json` → Vercel Blob

### 4. Deploy

Vercel auto-deploys on git push. Or manually:

```bash
vercel --prod
```

### 5. Test Admin Login

- Navigate to your site
- Type `sudo admin` in the terminal
- Default password: `password`
- Change password after first login!

---

## Key Differences from VPS

| Aspect | VPS (Express) | Vercel (Serverless) |
|--------|---------------|---------------------|
| API Server | Express.js on port 3001 | Serverless functions in `/api` |
| Data Storage | JSON files on disk (`/content`) | Vercel Blob (cloud storage) |
| Sessions | In-memory Map | Vercel KV (Upstash Redis REST API) |
| Process Manager | PM2 | N/A (managed by Vercel) |
| SSL | Let's Encrypt + Nginx | Automatic |
| Scaling | Manual (single server) | Automatic |
| Cold Starts | None | Possible on first request |

---

## Switching Back to VPS

### Step 1: Export Data from Vercel Blob

Before switching, download your current data from Vercel Blob dashboard or use this script to fetch it:

```typescript
// Run locally with BLOB_READ_WRITE_TOKEN set
import { list } from '@vercel/blob';

const { blobs } = await list({ prefix: 'content/', token: process.env.BLOB_READ_WRITE_TOKEN });
for (const blob of blobs) {
  const res = await fetch(blob.url);
  const data = await res.json();
  // Save to local content/ directory
  console.log(blob.pathname, data);
}
```

### Step 2: Remove Vercel Files

```powershell
# Remove API directory
Remove-Item -Recurse -Force api/

# Remove Vercel config
Remove-Item vercel.json

# Remove migration script
Remove-Item scripts/seed-vercel-blob.ts
```

### Step 3: Remove Vercel Dependencies

```bash
pnpm remove @vercel/blob @vercel/kv @vercel/node
```

### Step 4: Remove Migration Script from package.json

Remove this line from `scripts`:
```json
"migrate:vercel": "tsx scripts/seed-vercel-blob.ts"
```

### Step 5: Revert Frontend Changes (if any)

The file `src/features/portfolio/ui/PortfolioApp.tsx` has added error alerts for debugging. You may want to revert these:

```typescript
// Remove the alert() calls in handleUpdateProject if desired
```

### Step 6: Deploy to VPS

Follow `deploy/DEPLOYMENT.md` for full VPS setup:

1. Set up server with Node.js, Nginx, PM2
2. Clone repo to `/var/www/tui-blog`
3. Run `pnpm install && pnpm build`
4. Start API with PM2: `pm2 start ecosystem.config.cjs`
5. Configure Nginx to proxy `/api` to port 3001
6. Set up SSL with Certbot

### VPS Files (Preserved & Ready to Use)

- `server/api.ts` - Express API server (unchanged, fully functional)
- `deploy/DEPLOYMENT.md` - Complete VPS setup guide
- `deploy/nginx.conf` - Nginx configuration
- `deploy/setup-server.sh` - Server setup script
- `deploy/update.sh` - Deployment update script
- `ecosystem.config.cjs` - PM2 configuration

---

## Troubleshooting

### API returns 500 errors
- Check Vercel Function logs (Dashboard → Deployments → Functions)
- Verify `BLOB_READ_WRITE_TOKEN` is set in Environment Variables
- Make sure all imports use `.js` extensions

### API returns 405 Method Not Allowed
- This means the wrong route handler is being called
- Check that `vercel.json` uses `rewrites` not `routes`
- Dynamic routes like `[id].ts` need Vercel's automatic routing

### API returns 404
- Check the function exists in `/api` directory
- Verify file naming matches expected route (`[id].ts` for dynamic)
- Redeploy after making changes

### Sessions not persisting / Login fails
- Must use **Vercel's native KV** (not Redis Labs or other providers)
- The `@vercel/kv` package requires REST API, not Redis protocol
- Check all `KV_*` environment variables are set

### "ERR_MODULE_NOT_FOUND" in function logs
- Add `.js` extension to all relative imports in `/api` files
- Example: `from './storage.js'` not `from './storage'`

### Portfolio/Blog edit not saving
- Check browser console for errors
- Verify the PUT request returns 200, not 405
- If 405: the `vercel.json` routing is misconfigured

### Local Development
The original VPS setup still works locally:
```bash
pnpm dev  # Runs Vite + Express API concurrently
```

The frontend (`src/shared/lib/api.ts`) automatically uses `localhost:3001` in development mode.

---

## Content Files

Your content is stored in two places:

**Local (for VPS / development):**
- `content/blog.json`
- `content/portfolio.json`
- `content/admin.json`
- `content/visitors.json`

**Vercel Blob (for production):**
- `content/blog.json`
- `content/portfolio.json`
- `content/admin.json`
- `content/visitors.json`

Keep local files in sync by running the migration script after local edits, or export from Blob before switching to VPS.

---

## Git Commits for This Migration

Key commits for reference:
1. `feat: add Vercel deployment support` - Initial API functions and config
2. `fix: add .js extensions for ESM module resolution` - Node.js ESM fix
3. `fix: update vercel.json routes for API functions` - Initial routing attempt
4. `fix: use rewrites instead of routes for proper dynamic API routing` - Final routing fix
