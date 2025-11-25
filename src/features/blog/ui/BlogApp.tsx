import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '../../../shared/lib/api';
import type { BlogPost } from '../../../shared/lib/api';
import { renderMarkdown, stripMarkdown } from '../../../shared/lib/markdown';
import { TuiEditor } from '../../../shared/ui/editor';
import type { EditorData } from '../../../shared/ui/editor';

interface BlogAppProps {
  onBack: () => void;
  isAdmin?: boolean;
}

/**
 * Blog TUI Application
 * Displays blog posts in a terminal-style reader
 * Admin mode allows creating, editing, and deleting posts
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
    fetchBlogPosts()
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, []);

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

  // Show editor for new post
  if (isCreating) {
    return (
      <TuiEditor
        title="New Blog Post"
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter post title...' },
          { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'react, typescript, web' },
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
          { name: 'content', label: 'Content (Markdown)', type: 'textarea', required: true, placeholder: '# My Post\n\nWrite your content here using **Markdown**...' },
        ]}
        initialData={{
          title: editingPost.title,
          tags: editingPost.tags?.join(', ') || '',
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
      <div className="h-full overflow-auto p-4" style={{ color: 'var(--term-foreground)' }}>
        <div
          className="flex items-center justify-between px-2 py-1 mb-4 border-b"
          style={{ borderColor: 'var(--term-border)' }}
        >
          <span style={{ color: 'var(--term-muted)' }}>BLOG POST</span>
          <span style={{ color: 'var(--term-muted)' }}>
            {isAdmin ? '[e] edit | [d] delete | ' : ''}[q] back
          </span>
        </div>

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
            <p className="text-sm mt-1" style={{ color: 'var(--term-muted)' }}>
              Press [y] to confirm, [n] to cancel
            </p>
          </motion.div>
        )}

        {/* Admin action buttons */}
        {isAdmin && !showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-2 flex gap-2"
          >
            <button
              onClick={() => setEditingPost(viewingPost)}
              className="px-3 py-1 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--term-selection)',
                color: 'var(--term-primary)',
                border: '1px solid var(--term-primary)',
              }}
            >
              Edit [e]
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--term-selection)',
                color: 'var(--term-error)',
                border: '1px solid var(--term-error)',
              }}
            >
              Delete [d]
            </button>
          </motion.div>
        )}

        <article className="px-2 space-y-4">
          <header>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--term-primary)' }}>
              {viewingPost.title}
            </h1>
            <time className="text-sm" style={{ color: 'var(--term-muted)' }}>
              {format(new Date(viewingPost.date), 'MMMM d, yyyy')}
            </time>
            {viewingPost.tags && viewingPost.tags.length > 0 && (
              <div className="flex gap-2 mt-2">
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

          <footer
            className="pt-4 border-t text-sm"
            style={{ borderColor: 'var(--term-border)', color: 'var(--term-muted)' }}
          >
            Press [q] or [Esc] to return to post list
          </footer>
        </article>
      </div>
    );
  }

  // Show post list
  return (
    <div className="h-full overflow-auto p-4" style={{ color: 'var(--term-foreground)' }}>
      <div
        className="flex items-center justify-between px-2 py-1 mb-4 border-b"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>
          BLOG {isAdmin && <span style={{ color: 'var(--term-success)' }}>[ADMIN]</span>}
        </span>
        <span style={{ color: 'var(--term-muted)' }}>
          {posts.length} posts | [j/k] nav | [Enter] read | {isAdmin && '[n] new | '}[q] quit
        </span>
      </div>

      {saveStatus === 'saved' && (
        <div className="mb-4 px-2 py-1 text-sm" style={{ color: 'var(--term-success)' }}>
          Post saved successfully!
        </div>
      )}

      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-2"
        >
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--term-selection)',
              color: 'var(--term-primary)',
              border: '1px solid var(--term-primary)',
            }}
          >
            + New Post [n]
          </button>
        </motion.div>
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
              className="flex items-start gap-3 px-2 py-2 cursor-pointer transition-colors"
              style={{
                backgroundColor: index === selectedIndex ? 'var(--term-selection)' : 'transparent',
                borderLeft: index === selectedIndex ? '2px solid var(--term-primary)' : '2px solid transparent',
              }}
            >
              <span style={{ color: 'var(--term-muted)' }}>{index === selectedIndex ? '>' : ' '}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    className="font-medium"
                    style={{ color: index === selectedIndex ? 'var(--term-primary)' : 'var(--term-foreground)' }}
                  >
                    {post.title}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--term-muted)' }}>
                    {format(new Date(post.date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="text-sm truncate" style={{ color: 'var(--term-muted)' }}>
                  {post.excerpt}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogApp;
