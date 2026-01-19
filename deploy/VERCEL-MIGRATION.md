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
- Vercel KV (Redis) for session storage
- Static frontend deployed to Vercel CDN

---

## Files Added for Vercel

### Configuration

- `vercel.json` - Vercel deployment configuration

### API Functions (Serverless)

All API routes are now in the `/api` directory:

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

### Dependencies Added

```json
{
  "@vercel/blob": "^x.x.x",
  "@vercel/kv": "^x.x.x",
  "@vercel/node": "^x.x.x"
}
```

---

## Environment Variables Required on Vercel

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Token for Vercel Blob storage (auto-generated when you create a Blob store) |
| `KV_REST_API_URL` | Vercel KV REST API URL (auto-generated when you create a KV store) |
| `KV_REST_API_TOKEN` | Vercel KV REST API token (auto-generated) |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV read-only token (auto-generated) |

---

## Deployment Steps

### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link
```

### 2. Create Storage Resources

In the Vercel Dashboard:

1. Go to your project → Storage
2. **Create Blob Store**: Click "Create Database" → "Blob" → Name it (e.g., "tui-blog-content")
3. **Create KV Store**: Click "Create Database" → "KV" → Name it (e.g., "tui-blog-sessions")

Environment variables will be automatically added to your project.

### 3. Migrate Content Data

Run the migration script to upload your existing JSON data to Vercel Blob:

```bash
# Make sure you have BLOB_READ_WRITE_TOKEN set locally
pnpm run migrate:vercel
```

Or manually upload via the Vercel Blob Dashboard, or use the seed script (see `scripts/seed-vercel-blob.ts`).

### 4. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Key Differences from VPS

| Aspect | VPS (Express) | Vercel (Serverless) |
|--------|---------------|---------------------|
| API Server | Express.js on port 3001 | Serverless functions |
| Data Storage | JSON files on disk | Vercel Blob |
| Sessions | In-memory Map | Vercel KV (Redis) |
| Process Manager | PM2 | N/A (managed by Vercel) |
| SSL | Let's Encrypt + Nginx | Automatic |
| Scaling | Manual (single server) | Automatic |

---

## Switching Back to VPS

To revert to the VPS deployment:

1. **Remove Vercel files** (optional):
   ```bash
   rm -rf api/
   rm vercel.json
   ```

2. **Remove Vercel dependencies**:
   ```bash
   pnpm remove @vercel/blob @vercel/kv @vercel/node
   ```

3. **Follow the VPS deployment guide**: See `deploy/DEPLOYMENT.md`

4. **Restore the server/api.ts** usage - it's still in place and ready to use

The original VPS files are preserved:
- `server/api.ts` - Express API server (unchanged)
- `deploy/DEPLOYMENT.md` - VPS setup guide
- `deploy/nginx.conf` - Nginx configuration
- `deploy/setup-server.sh` - Server setup script
- `deploy/update.sh` - Deployment update script
- `ecosystem.config.cjs` - PM2 configuration

---

## Data Migration

### Exporting from VPS (if server is still accessible)

```bash
# SSH to VPS and copy content files
scp user@your-vps:/var/www/tui-blog/content/*.json ./content/
```

### Importing to Vercel Blob

The migration script reads from local `content/` directory and uploads to Vercel Blob:

```bash
pnpm run migrate:vercel
```

### Current Content Files

Your content is stored locally in `content/` directory:
- `blog.json` - Blog posts
- `portfolio.json` - Portfolio projects
- `admin.json` - Admin configuration (password hash)
- `visitors.json` - Visitor logs

---

## Troubleshooting

### API returns empty data
- Check that Blob storage is connected and has data
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Run the migration script to seed data

### Sessions not persisting
- Check that KV store is connected
- Verify all `KV_*` environment variables are set

### Build fails
- Make sure all Vercel packages are installed
- Check that TypeScript compiles without errors

### Local Development
For local development, the original setup still works:
```bash
pnpm dev  # Runs both Vite dev server and Express API
```

The frontend API client (`src/shared/lib/api.ts`) automatically uses `localhost:3001` in development.
