import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fetchBlogPosts, fetchBlogPostBySlug, createBlogPost, updateBlogPost, deleteBlogPost } from '../../../shared/lib/api';
import type { BlogPost } from '../../../shared/lib/api';
import { renderMarkdown, stripMarkdown } from '../../../shared/lib/markdown';
import { TuiEditor } from '../../../shared/ui/editor';
import type { EditorData } from '../../../shared/ui/editor';
import { TouchNav, type NavAction } from '../../../shared/ui/tui';
import CommentSection from './comments/CommentSection';
import { AdminCommentsPanel } from './comments/AdminCommentsPanel';

interface BlogAppProps {
  onBack: () => void;
  isAdmin?: boolean;
}

/**
 * Blog TUI Application
 * Displays blog posts in a terminal-style reader
 * Admin mode allows creating, editing, and deleting posts
 * Touch-friendly navigation for mobile users
 */
const BlogApp: React.FC<BlogAppProps> = ({ onBack, isAdmin = false }) => {
  // With route path="/blog/*", the slug is in params['*'], not params.slug
  const params = useParams();
  const slug = params['*'] || undefined;
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Refs for autoscroll on keyboard navigation
  const listItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // View a post (updates URL for shareable links)
  const viewPost = useCallback((post: BlogPost | null) => {
    setViewingPost(post);
    if (post?.slug) {
      navigate(`/blog/${post.slug}`);
    } else if (!post) {
      navigate('/blog');
    }
  }, [navigate]);

  // Load posts on mount
  useEffect(() => {
    setIsLoading(true);
    fetchBlogPosts(isAdmin) // Pass isAdmin to include admin-only posts
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  // Sync viewingPost state with URL slug
  useEffect(() => {
    // URL is /blog with no slug - clear viewing state
    if (!slug) {
      setViewingPost(null);
      return;
    }

    const loadPost = async () => {
      const post = await fetchBlogPostBySlug(slug, isAdmin);
      if (post) {
        setViewingPost(post);
      }
    };

    // Only fetch if we don't already have it displayed
    if (!viewingPost || viewingPost.slug !== slug) {
      loadPost();
    }
  }, [slug, isAdmin]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isCreating || editingPost) return;

      if (showDeleteConfirm) {
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleConfirmDelete();
        } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
          e.preventDefault();
          setShowDeleteConfirm(false);
        }
        return;
      }

      if (viewingPost) {
        if (e.key === 'Escape' || e.key === 'q') {
          e.preventDefault();
          viewPost(null);
        }
        if (isAdmin && e.key === 'e') {
          e.preventDefault();
          setEditingPost(viewingPost);
        }
        if (isAdmin && e.key === 'd') {
          e.preventDefault();
          setShowDeleteConfirm(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(0, i - 1));
          break;
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(posts.length - 1, i + 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (posts[selectedIndex]) {
            viewPost(posts[selectedIndex]);
          }
          break;
        case 'n':
          if (isAdmin) {
            e.preventDefault();
            setIsCreating(true);
          }
          break;
        case 'm':
          if (isAdmin) {
            e.preventDefault();
            setShowAdminPanel(prev => !prev);
          }
          break;
        case 'Escape':
        case 'q':
          e.preventDefault();
          if (showAdminPanel) {
            setShowAdminPanel(false);
          } else {
            onBack();
          }
          break;
      }
    },
    [posts, selectedIndex, viewingPost, onBack, isAdmin, isCreating, editingPost, showDeleteConfirm, showAdminPanel, viewPost],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Autoscroll to keep selected item visible during keyboard navigation
  useEffect(() => {
    if (!viewingPost && listItemRefs.current[selectedIndex]) {
      listItemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex, viewingPost]);

  const handleSavePost = useCallback(async (data: EditorData) => {
    setSaveStatus('saving');
    try {
      const newPost = await createBlogPost({
        title: data.title,
        excerpt: stripMarkdown(data.content).substring(0, 150) + '...',
        content: data.content,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        adminOnly: data.adminOnly === 'true',
      });
      setPosts(prev => [newPost, ...prev]);
      setIsCreating(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save post:', err);
      setSaveStatus('error');
    }
  }, []);

  const handleUpdatePost = useCallback(async (data: EditorData) => {
    if (!editingPost) return;

    setSaveStatus('saving');
    try {
      const updated = await updateBlogPost(editingPost.slug, {
        title: data.title,
        excerpt: stripMarkdown(data.content).substring(0, 150) + '...',
        content: data.content,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        adminOnly: data.adminOnly === 'true',
      });
      setPosts(prev => prev.map(p => p.slug === editingPost.slug ? updated : p));
      viewPost(updated);
      setEditingPost(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to update post:', err);
      setSaveStatus('error');
    }
  }, [editingPost, viewPost]);

  const handleConfirmDelete = useCallback(async () => {
    if (!viewingPost) return;

    try {
      await deleteBlogPost(viewingPost.slug);
      setPosts(prev => prev.filter(p => p.slug !== viewingPost.slug));
      viewPost(null);
      setShowDeleteConfirm(false);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }, [viewingPost, viewPost]);

  // Navigation actions for list view
  const getListActions = (): NavAction[] => {
    const actions: NavAction[] = [];
    if (isAdmin) {
      actions.push({ key: 'n', label: 'New', onClick: () => setIsCreating(true) });
      actions.push({
        key: 'm',
        label: showAdminPanel ? 'Posts' : 'Moderate',
        onClick: () => setShowAdminPanel(prev => !prev)
      });
    }
    actions.push({ key: 'q', label: 'Back', onClick: showAdminPanel ? () => setShowAdminPanel(false) : onBack });
    return actions;
  };

  // Navigation actions for post view
  const getPostActions = (): NavAction[] => {
    const actions: NavAction[] = [];
    if (isAdmin) {
      actions.push({ key: 'e', label: 'Edit', onClick: () => viewingPost && setEditingPost(viewingPost) });
      actions.push({ key: 'd', label: 'Delete', onClick: () => setShowDeleteConfirm(true), variant: 'danger' });
    }
    actions.push({ key: 'q', label: 'Back', onClick: () => viewPost(null) });
    return actions;
  };

  // Show editor for new post
  if (isCreating) {
    return (
      <TuiEditor
        title="New Blog Post"
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter post title...' },
          { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'react, typescript, web' },
          { name: 'adminOnly', label: 'Visibility', type: 'checkbox', placeholder: 'Admin-only (hidden from visitors)' },
          { name: 'content', label: 'Content (Markdown)', type: 'textarea', required: true, placeholder: '# My Post\n\nWrite your content here using **Markdown**...' },
        ]}
        onSave={handleSavePost}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  // Show editor for editing existing post
  if (editingPost) {
    return (
      <TuiEditor
        title={`Edit: ${editingPost.title}`}
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter post title...' },
          { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'react, typescript, web' },
          { name: 'adminOnly', label: 'Visibility', type: 'checkbox', placeholder: 'Admin-only (hidden from visitors)' },
          { name: 'content', label: 'Content (Markdown)', type: 'textarea', required: true, placeholder: '# My Post\n\nWrite your content here using **Markdown**...' },
        ]}
        initialData={{
          title: editingPost.title,
          tags: editingPost.tags?.join(', ') || '',
          adminOnly: editingPost.adminOnly ? 'true' : 'false',
          content: editingPost.content || editingPost.excerpt,
        }}
        onSave={handleUpdatePost}
        onCancel={() => setEditingPost(null)}
      />
    );
  }

  // Show individual post
  if (viewingPost) {
    return (
      <div className="h-full flex flex-col" style={{ color: 'var(--term-foreground)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--term-border)' }}
        >
          <span style={{ color: 'var(--term-muted)' }}>BLOG POST</span>
          <span className="hidden sm:block text-sm" style={{ color: 'var(--term-muted)' }}>
            {isAdmin ? '[e] edit | [d] delete | ' : ''}[q] back
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 border"
              style={{ 
                borderColor: 'var(--term-error)', 
                backgroundColor: 'var(--term-selection)' 
              }}
            >
              <p style={{ color: 'var(--term-error)' }}>
                Delete "{viewingPost.title}"?
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium min-h-[44px] touch-manipulation"
                  style={{
                    backgroundColor: 'var(--term-error)',
                    color: 'var(--term-background)',
                  }}
                >
                  [y] Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium min-h-[44px] touch-manipulation"
                  style={{
                    backgroundColor: 'var(--term-selection)',
                    color: 'var(--term-foreground)',
                    border: '1px solid var(--term-border)',
                  }}
                >
                  [n] Cancel
                </button>
              </div>
            </motion.div>
          )}

          <article className="space-y-4">
            <header>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold" style={{ color: 'var(--term-primary)' }}>
                  {viewingPost.title}
                </h1>
                {viewingPost.adminOnly && (
                  <span 
                    className="text-xs px-1.5 py-0.5" 
                    style={{ backgroundColor: 'var(--term-warning)', color: 'var(--term-background)' }}
                  >
                    ADMIN ONLY
                  </span>
                )}
              </div>
              <time className="text-sm" style={{ color: 'var(--term-muted)' }}>
                {format(new Date(viewingPost.date), 'MMMM d, yyyy')}
              </time>
              {viewingPost.tags && viewingPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {viewingPost.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5"
                      style={{ backgroundColor: 'var(--term-selection)', color: 'var(--term-secondary)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div
              className="prose prose-invert max-w-none leading-relaxed markdown-content"
              style={{ color: 'var(--term-foreground)' }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(viewingPost.content || viewingPost.excerpt) }}
            />
          </article>

          {/* Comments Section */}
          <CommentSection postSlug={viewingPost.slug} />
        </div>

        {/* Touch Navigation Bar */}
        <div
          className="shrink-0 border-t p-2"
          style={{ borderColor: 'var(--term-border)', backgroundColor: 'var(--term-selection)' }}
        >
          <TouchNav actions={getPostActions()} />
        </div>
      </div>
    );
  }

  // Navigate to a post from admin panel
  const handleNavigateToPost = useCallback((postSlug: string) => {
    const post = posts.find(p => p.slug === postSlug);
    if (post) {
      viewPost(post);
      setShowAdminPanel(false);
    }
  }, [posts, viewPost]);

  // Show post list
  return (
    <div className="h-full flex flex-col" style={{ color: 'var(--term-foreground)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>
          {showAdminPanel ? 'COMMENT MODERATION' : 'BLOG'} {isAdmin && <span style={{ color: 'var(--term-success)' }}>[ADMIN]</span>}
        </span>
        <span className="hidden sm:block text-sm" style={{ color: 'var(--term-muted)' }}>
          {showAdminPanel ? '[m] posts | [q] back' : `${posts.length} posts | [j/k] nav | [Enter] read${isAdmin ? ' | [m] moderate' : ''}`}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {showAdminPanel ? (
          <AdminCommentsPanel onNavigateToPost={handleNavigateToPost} />
        ) : (
          <>
        {saveStatus === 'saved' && (
          <div className="mb-4 px-2 py-1 text-sm" style={{ color: 'var(--term-success)' }}>
            Post saved successfully!
          </div>
        )}

        {isLoading ? (
          <div className="px-2" style={{ color: 'var(--term-muted)' }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="px-2" style={{ color: 'var(--term-muted)' }}>No posts yet.</div>
        ) : (
          <div className="space-y-1">
            {posts.map((post, index) => (
              <motion.div
                key={post.slug}
                ref={(el) => { listItemRefs.current[index] = el; }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedIndex(index);
                  viewPost(post);
                }}
                className="flex items-start gap-3 px-2 py-3 cursor-pointer transition-colors touch-manipulation"
                style={{
                  backgroundColor: index === selectedIndex ? 'var(--term-selection)' : 'transparent',
                  borderLeft: index === selectedIndex ? '2px solid var(--term-primary)' : '2px solid transparent',
                }}
              >
                <span style={{ color: 'var(--term-muted)' }}>{index === selectedIndex ? '>' : ' '}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span
                      className="font-medium"
                      style={{ color: index === selectedIndex ? 'var(--term-primary)' : 'var(--term-foreground)' }}
                    >
                      {post.title}
                    </span>
                    {post.adminOnly && (
                      <span 
                        className="text-xs px-1.5 py-0.5" 
                        style={{ backgroundColor: 'var(--term-warning)', color: 'var(--term-background)' }}
                      >
                        ADMIN
                      </span>
                    )}
                    <span className="text-sm" style={{ color: 'var(--term-muted)' }}>
                      {format(new Date(post.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="text-sm truncate mt-1" style={{ color: 'var(--term-muted)' }}>
                    {post.excerpt}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/* Touch Navigation Bar */}
      <div
        className="shrink-0 border-t p-2"
        style={{ borderColor: 'var(--term-border)', backgroundColor: 'var(--term-selection)' }}
      >
        <TouchNav actions={getListActions()} />
      </div>
    </div>
  );
};

export default BlogApp;
