import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '../../../shared/lib/api';
import type { BlogPost } from '../../../shared/lib/api';
import { renderMarkdown, stripMarkdown } from '../../../shared/lib/markdown';
import { TuiEditor } from '../../../shared/ui/editor';
import type { EditorData } from '../../../shared/ui/editor';
import { TouchNav, type NavAction } from '../../../shared/ui/tui';

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
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchBlogPosts(isAdmin) // Pass isAdmin to include admin-only posts
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

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
          setViewingPost(null);
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
            setViewingPost(posts[selectedIndex]);
          }
          break;
        case 'n':
          if (isAdmin) {
            e.preventDefault();
            setIsCreating(true);
          }
          break;
        case 'Escape':
        case 'q':
          e.preventDefault();
          onBack();
          break;
      }
    },
    [posts, selectedIndex, viewingPost, onBack, isAdmin, isCreating, editingPost, showDeleteConfirm],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
      setViewingPost(updated);
      setEditingPost(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to update post:', err);
      setSaveStatus('error');
    }
  }, [editingPost]);

  const handleConfirmDelete = useCallback(async () => {
    if (!viewingPost) return;
    
    try {
      await deleteBlogPost(viewingPost.slug);
      setPosts(prev => prev.filter(p => p.slug !== viewingPost.slug));
      setViewingPost(null);
      setShowDeleteConfirm(false);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }, [viewingPost]);

  // Navigation actions for list view
  const getListActions = (): NavAction[] => {
    const actions: NavAction[] = [];
    if (isAdmin) {
      actions.push({ key: 'n', label: 'New', onClick: () => setIsCreating(true) });
    }
    actions.push({ key: 'q', label: 'Back', onClick: onBack });
    return actions;
  };

  // Navigation actions for post view
  const getPostActions = (): NavAction[] => {
    const actions: NavAction[] = [];
    if (isAdmin) {
      actions.push({ key: 'e', label: 'Edit', onClick: () => viewingPost && setEditingPost(viewingPost) });
      actions.push({ key: 'd', label: 'Delete', onClick: () => setShowDeleteConfirm(true), variant: 'danger' });
    }
    actions.push({ key: 'q', label: 'Back', onClick: () => setViewingPost(null) });
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

  // Show post list
  return (
    <div className="h-full flex flex-col" style={{ color: 'var(--term-foreground)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>
          BLOG {isAdmin && <span style={{ color: 'var(--term-success)' }}>[ADMIN]</span>}
        </span>
        <span className="hidden sm:block text-sm" style={{ color: 'var(--term-muted)' }}>
          {posts.length} posts | [j/k] nav | [Enter] read
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedIndex(index);
                  setViewingPost(post);
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
