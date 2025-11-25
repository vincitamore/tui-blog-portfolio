/**
 * Lightweight API Server for Portfolio
 * Saves blog posts and portfolio projects directly to JSON files
 * No database required - just simple file-based storage
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure content directory exists
async function ensureContentDir() {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
  } catch (err) {
    // Directory exists
  }
}

// Helper to read JSON file
async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const filepath = path.join(CONTENT_DIR, filename);
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

// Helper to write JSON file
async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  await ensureContentDir();
  const filepath = path.join(CONTENT_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============ BLOG ENDPOINTS ============

// Get all blog posts
app.get('/api/blog', async (_req, res) => {
  try {
    const posts = await readJsonFile('blog.json', []);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read posts' });
  }
});

// Create new blog post
app.post('/api/blog', async (req, res) => {
  try {
    const posts = await readJsonFile<any[]>('blog.json', []);
    const newPost = {
      ...req.body,
      slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      date: req.body.date || new Date().toISOString(),
      id: Date.now().toString(),
    };
    posts.unshift(newPost); // Add to beginning
    await writeJsonFile('blog.json', posts);
    res.json(newPost);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update blog post
app.put('/api/blog/:slug', async (req, res) => {
  try {
    const posts = await readJsonFile<any[]>('blog.json', []);
    const index = posts.findIndex(p => p.slug === req.params.slug);
    if (index === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    posts[index] = { ...posts[index], ...req.body };
    await writeJsonFile('blog.json', posts);
    res.json(posts[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete blog post
app.delete('/api/blog/:slug', async (req, res) => {
  try {
    const posts = await readJsonFile<any[]>('blog.json', []);
    const filtered = posts.filter(p => p.slug !== req.params.slug);
    await writeJsonFile('blog.json', filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ============ PORTFOLIO ENDPOINTS ============

// Get all projects
app.get('/api/portfolio', async (_req, res) => {
  try {
    const projects = await readJsonFile('portfolio.json', []);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// Create new project
app.post('/api/portfolio', async (req, res) => {
  try {
    const projects = await readJsonFile<any[]>('portfolio.json', []);
    const newProject = {
      ...req.body,
      id: Date.now().toString(),
    };
    projects.unshift(newProject);
    await writeJsonFile('portfolio.json', projects);
    res.json(newProject);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/portfolio/:id', async (req, res) => {
  try {
    const projects = await readJsonFile<any[]>('portfolio.json', []);
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    projects[index] = { ...projects[index], ...req.body };
    await writeJsonFile('portfolio.json', projects);
    res.json(projects[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/portfolio/:id', async (req, res) => {
  try {
    const projects = await readJsonFile<any[]>('portfolio.json', []);
    const filtered = projects.filter(p => p.id !== req.params.id);
    await writeJsonFile('portfolio.json', filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Reorder projects
app.post('/api/portfolio/reorder', async (req, res) => {
  try {
    const { projectIds } = req.body;
    if (!Array.isArray(projectIds)) {
      return res.status(400).json({ error: 'projectIds must be an array' });
    }
    const projects = await readJsonFile<any[]>('portfolio.json', []);
    // Create a map for quick lookup
    const projectMap = new Map(projects.map(p => [p.id, p]));
    // Reorder based on provided IDs
    const reordered = projectIds
      .map(id => projectMap.get(id))
      .filter(Boolean);
    // Add any projects that weren't in the list (safety measure)
    const reorderedIds = new Set(projectIds);
    projects.forEach(p => {
      if (!reorderedIds.has(p.id)) {
        reordered.push(p);
      }
    });
    await writeJsonFile('portfolio.json', reordered);
    res.json(reordered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder projects' });
  }
});

// ============ ADMIN PASSWORD ENDPOINTS ============

// Default password hash for "password" - will be overwritten once changed
const DEFAULT_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

// Get current password hash (for client-side verification)
app.get('/api/admin/hash', async (_req, res) => {
  try {
    const config = await readJsonFile<{ passwordHash?: string }>('admin.json', {});
    res.json({ hash: config.passwordHash || DEFAULT_HASH });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// Update password hash
app.put('/api/admin/password', async (req, res) => {
  try {
    const { hash } = req.body;
    if (!hash || typeof hash !== 'string' || hash.length !== 64) {
      return res.status(400).json({ error: 'Invalid hash format' });
    }
    const config = await readJsonFile<{ passwordHash?: string }>('admin.json', {});
    config.passwordHash = hash;
    await writeJsonFile('admin.json', config);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Start server
const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Content directory: ${CONTENT_DIR}`);
});


