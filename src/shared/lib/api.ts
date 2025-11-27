/**
 * API Client for Portfolio
 * Communicates with the Express server to manage content
 * All write operations require authentication
 */

import { getAuthHeaders } from './auth';

// In production, use relative URL (nginx proxies /api to the backend)
// In development, use localhost:3001
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Helper to handle auth errors
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    throw new Error('Authentication required. Please login as admin.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ============ BLOG API ============

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content?: string;
  tags?: string[];
  adminOnly?: boolean;
}

export async function fetchBlogPosts(includeAdminOnly = false): Promise<BlogPost[]> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    // If admin, include auth token to get admin-only posts
    if (includeAdminOnly) {
      const authHeaders = getAuthHeaders();
      Object.assign(headers, authHeaders);
    }
    
    const res = await fetch(`${API_URL}/api/blog`, { headers });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  } catch (err) {
    console.error('API Error:', err);
    // Fallback to static import if API is down
    return [];
  }
}

export async function createBlogPost(post: Omit<BlogPost, 'id' | 'slug' | 'date'>): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/api/blog`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(post),
  });
  return handleResponse(res);
}

export async function updateBlogPost(slug: string, post: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/api/blog/${slug}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(post),
  });
  return handleResponse(res);
}

export async function deleteBlogPost(slug: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/blog/${slug}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    throw new Error('Authentication required. Please login as admin.');
  }
  if (!res.ok) throw new Error('Failed to delete post');
}

// ============ PORTFOLIO API ============

export interface Project {
  id?: string;
  title: string;
  description: string;
  technologies: string[];
  github?: string;
  link?: string;
  image?: string;
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/api/portfolio`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  } catch (err) {
    console.error('API Error:', err);
    return [];
  }
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
  const res = await fetch(`${API_URL}/api/portfolio`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(project),
  });
  return handleResponse(res);
}

export async function updateProject(id: string, project: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_URL}/api/portfolio/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(project),
  });
  return handleResponse(res);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/portfolio/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    throw new Error('Authentication required. Please login as admin.');
  }
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function reorderProjects(projectIds: string[]): Promise<Project[]> {
  const res = await fetch(`${API_URL}/api/portfolio/reorder`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ projectIds }),
  });
  return handleResponse(res);
}


