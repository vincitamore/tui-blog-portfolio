/**
 * API Client for Portfolio
 * Communicates with the Express server to manage content
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============ BLOG API ============

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content?: string;
  tags?: string[];
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/api/blog`);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

export async function updateBlogPost(slug: string, post: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/api/blog/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error('Failed to update post');
  return res.json();
}

export async function deleteBlogPost(slug: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/blog/${slug}`, {
    method: 'DELETE',
  });
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProject(id: string, project: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_URL}/api/portfolio/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/portfolio/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function reorderProjects(projectIds: string[]): Promise<Project[]> {
  const res = await fetch(`${API_URL}/api/portfolio/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder projects');
  return res.json();
}


