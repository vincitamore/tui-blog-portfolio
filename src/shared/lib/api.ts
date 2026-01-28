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

export async function fetchBlogPostBySlug(slug: string, includeAdminOnly = false): Promise<BlogPost | null> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    // If admin, include auth token to get admin-only posts
    if (includeAdminOnly) {
      const authHeaders = getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    const res = await fetch(`${API_URL}/api/blog/${slug}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch post');
    return res.json();
  } catch (err) {
    console.error('API Error:', err);
    return null;
  }
}

// ============ PORTFOLIO API ============

export interface Project {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  content?: string;  // Full markdown content for detailed view
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

export async function fetchProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const res = await fetch(`${API_URL}/api/portfolio/slug/${slug}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  } catch (err) {
    console.error('API Error:', err);
    return null;
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

// ============ COMMENTS API ============

export interface Comment {
  id: string;
  postSlug: string;
  parentId: string | null;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  edited: boolean;
}

// localStorage keys for comment author identity
const AUTHOR_TOKEN_KEY = 'comment_author_token';
const AUTHOR_NAME_KEY = 'comment_author_name';

// Generate or retrieve author token from localStorage
export function getAuthorToken(): string {
  let token = localStorage.getItem(AUTHOR_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(AUTHOR_TOKEN_KEY, token);
  }
  return token;
}

// Get/set saved author name
export function getSavedAuthorName(): string {
  return localStorage.getItem(AUTHOR_NAME_KEY) || '';
}

export function saveAuthorName(name: string): void {
  if (name.trim()) {
    localStorage.setItem(AUTHOR_NAME_KEY, name.trim());
  }
}

// Fetch comments for a blog post
export async function fetchComments(postSlug: string): Promise<Comment[]> {
  try {
    const res = await fetch(`${API_URL}/api/comments/${postSlug}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  } catch (err) {
    console.error('API Error:', err);
    return [];
  }
}

// Create a new comment
export async function createComment(
  postSlug: string,
  comment: { content: string; author?: string; parentId?: string }
): Promise<Comment> {
  const authorToken = getAuthorToken();

  // Save author name if provided
  if (comment.author) {
    saveAuthorName(comment.author);
  }

  const res = await fetch(`${API_URL}/api/comments/${postSlug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...comment,
      authorToken,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create comment');
  }

  return res.json();
}
