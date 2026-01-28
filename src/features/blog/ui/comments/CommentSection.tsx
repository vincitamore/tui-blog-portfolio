import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fetchComments, createComment, getSavedAuthorName } from '../../../../shared/lib/api';
import type { Comment } from '../../../../shared/lib/api';
import { renderMarkdown } from '../../../../shared/lib/markdown';

interface CommentSectionProps {
  postSlug: string;
}

/**
 * Comment Section Component
 * Displays comments for a blog post with a TUI aesthetic
 * Phase 1: Flat list, basic editor
 */
const CommentSection: React.FC<CommentSectionProps> = ({ postSlug }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [authorName, setAuthorName] = useState(getSavedAuthorName() || '');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load comments on mount
  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchComments(postSlug);
        setComments(data);
      } catch (err) {
        setError('Failed to load comments');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [postSlug]);

  // Handle comment submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setSubmitError('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newComment = await createComment(postSlug, {
        content: content.trim(),
        author: authorName.trim() || undefined,
      });

      // Add to list (optimistic update already happened via API)
      setComments(prev => [...prev, newComment]);
      setContent('');
      setShowPreview(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [postSlug, content, authorName]);

  return (
    <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--term-border)' }}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--term-primary)' }}>
          COMMENTS {comments.length > 0 && <span style={{ color: 'var(--term-muted)' }}>({comments.length})</span>}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-4" style={{ color: 'var(--term-muted)' }}>
          Loading comments...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="py-4" style={{ color: 'var(--term-error)' }}>
          {error}
        </div>
      )}

      {/* Comments List */}
      {!isLoading && !error && (
        <div className="space-y-4 mb-8">
          {comments.length === 0 ? (
            <div className="py-4" style={{ color: 'var(--term-muted)' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border"
                style={{
                  borderColor: 'var(--term-border)',
                  backgroundColor: 'var(--term-selection)',
                }}
              >
                {/* Comment Header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium" style={{ color: 'var(--term-secondary)' }}>
                    {comment.author}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--term-muted)' }}>
                    {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                  {comment.edited && (
                    <span className="text-xs" style={{ color: 'var(--term-muted)' }}>
                      (edited)
                    </span>
                  )}
                </div>

                {/* Comment Content */}
                <div
                  className="prose prose-invert prose-sm max-w-none markdown-content"
                  style={{ color: 'var(--term-foreground)' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
                />
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Comment Editor */}
      <div
        className="p-4 border"
        style={{
          borderColor: 'var(--term-border)',
          backgroundColor: 'var(--term-background)',
        }}
      >
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--term-primary)' }}>
          ADD COMMENT
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Author Name */}
          <div className="mb-4">
            <label className="block text-sm mb-1" style={{ color: 'var(--term-muted)' }}>
              Name (optional)
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="anonymous"
              maxLength={50}
              className="w-full p-2 bg-transparent border outline-none font-mono text-sm"
              style={{
                color: 'var(--term-foreground)',
                borderColor: 'var(--term-border)',
                fontSize: '16px', // Prevent iOS zoom
              }}
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm" style={{ color: 'var(--term-muted)' }}>
                Comment (Markdown supported)
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs px-2 py-1"
                style={{
                  color: showPreview ? 'var(--term-primary)' : 'var(--term-muted)',
                  backgroundColor: showPreview ? 'var(--term-selection)' : 'transparent',
                }}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {showPreview ? (
              <div
                className="w-full min-h-[120px] p-2 border prose prose-invert prose-sm max-w-none markdown-content"
                style={{
                  borderColor: 'var(--term-border)',
                  backgroundColor: 'var(--term-selection)',
                  color: 'var(--term-foreground)',
                }}
              >
                {content ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
                ) : (
                  <span style={{ color: 'var(--term-muted)' }}>Nothing to preview</span>
                )}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your comment here..."
                rows={5}
                maxLength={10000}
                className="w-full p-2 bg-transparent border outline-none font-mono text-sm resize-y"
                style={{
                  color: 'var(--term-foreground)',
                  borderColor: 'var(--term-border)',
                  fontSize: '16px', // Prevent iOS zoom
                  minHeight: '120px',
                }}
              />
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="mb-4 text-sm" style={{ color: 'var(--term-error)' }}>
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--term-muted)' }}>
              {content.length}/10000
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 text-sm font-medium min-h-[44px] touch-manipulation transition-opacity"
              style={{
                backgroundColor: 'var(--term-primary)',
                color: 'var(--term-background)',
                opacity: isSubmitting || !content.trim() ? 0.5 : 1,
              }}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
