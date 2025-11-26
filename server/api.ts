/**
 * Lightweight API Server for Portfolio
 * Saves blog posts and portfolio projects directly to JSON files
 * No database required - just simple file-based storage
 * 
 * SECURITY: All write operations require valid admin authentication
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');

const app = express();
app.use(cors());
app.use(express.json());

// ============ AUTHENTICATION ============

// In-memory session store (in production, use Redis or similar)
const activeSessions = new Map<string, { createdAt: number }>();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Default password hash for "password" - CHANGE THIS IN PRODUCTION
const DEFAULT_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

// Generate secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash password using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now - session.createdAt > SESSION_DURATION) {
      activeSessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Authentication middleware - protects admin routes
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const session = activeSessions.get(token);
  
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  
  // Check if session is expired
  if (Date.now() - session.createdAt > SESSION_DURATION) {
    activeSessions.delete(token);
    res.status(401).json({ error: 'Session expired' });
    return;
  }
  
  next();
}

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

// ============ AUTH ENDPOINTS ============

// Login - verify password and return session token
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    const config = await readJsonFile<{ passwordHash?: string }>('admin.json', {});
    const storedHash = config.passwordHash || DEFAULT_HASH;
    const providedHash = hashPassword(password);
    
    if (providedHash !== storedHash) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Create session
    const token = generateSessionToken();
    activeSessions.set(token, { createdAt: Date.now() });
    
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout - invalidate session token
app.post('/api/admin/logout', requireAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// Verify session is valid (for client to check)
app.get('/api/admin/verify', requireAuth, (_req, res) => {
  res.json({ valid: true });
});

// ============ VISITOR INFO ============

interface VisitorLog {
  ip: string;
  timestamp: string;
  userAgent: string;
}

const MAX_VISITOR_LOGS = 100; // Keep last 100 visits

// Get visitor's IP address and log the visit
app.get('/api/whoami', async (req, res) => {
  // Get IP from various headers (nginx sets x-forwarded-for)
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || 
             'unknown';
  
  // x-forwarded-for can be a comma-separated list, take the first one
  const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
  
  // Log the visit
  try {
    const logs = await readJsonFile<VisitorLog[]>('visitors.json', []);
    logs.unshift({
      ip: clientIp,
      timestamp: new Date().toISOString(),
      userAgent: (req.headers['user-agent'] || 'unknown').slice(0, 200),
    });
    // Keep only the last MAX_VISITOR_LOGS entries
    await writeJsonFile('visitors.json', logs.slice(0, MAX_VISITOR_LOGS));
  } catch {
    // Don't fail the request if logging fails
  }
  
  res.json({ ip: clientIp });
});

// Get visitor logs (admin only)
app.get('/api/visitors', requireAuth, async (_req, res) => {
  try {
    const logs = await readJsonFile<VisitorLog[]>('visitors.json', []);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read visitor logs' });
  }
});

// ============ BLOG ENDPOINTS ============

// Get all blog posts (public)
app.get('/api/blog', async (_req, res) => {
  try {
    const posts = await readJsonFile('blog.json', []);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read posts' });
  }
});

// Create new blog post (requires auth)
app.post('/api/blog', requireAuth, async (req, res) => {
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

// Update blog post (requires auth)
app.put('/api/blog/:slug', requireAuth, async (req, res) => {
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

// Delete blog post (requires auth)
app.delete('/api/blog/:slug', requireAuth, async (req, res) => {
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

// Get all projects (public)
app.get('/api/portfolio', async (_req, res) => {
  try {
    const projects = await readJsonFile('portfolio.json', []);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// Create new project (requires auth)
app.post('/api/portfolio', requireAuth, async (req, res) => {
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

// Update project (requires auth)
app.put('/api/portfolio/:id', requireAuth, async (req, res) => {
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

// Delete project (requires auth)
app.delete('/api/portfolio/:id', requireAuth, async (req, res) => {
  try {
    const projects = await readJsonFile<any[]>('portfolio.json', []);
    const filtered = projects.filter(p => p.id !== req.params.id);
    await writeJsonFile('portfolio.json', filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Reorder projects (requires auth)
app.post('/api/portfolio/reorder', requireAuth, async (req, res) => {
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

// Update password (requires auth + current password verification)
app.put('/api/admin/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Verify current password
    const config = await readJsonFile<{ passwordHash?: string }>('admin.json', {});
    const storedHash = config.passwordHash || DEFAULT_HASH;
    const currentHash = hashPassword(currentPassword);
    
    if (currentHash !== storedHash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update to new password
    config.passwordHash = hashPassword(newPassword);
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


