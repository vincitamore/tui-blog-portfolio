import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fetchComments, createComment, getSavedAuthorName } from '../../../../shared/lib/api';
import type { Comment } from '../../../../shared/lib/api';
import { renderMarkdown } from '../../../../shared/lib/markdown';

interface CommentSectionProps {
  postSlug: string;
}

// Comment with children for tree structure
interface CommentNode extends Comment {
  children: CommentNode[];
}

// Build tree from flat comment list
function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  // Create nodes with empty children
  comments.forEach(comment => {
    map.set(comment.id, { ...comment, children: [] });
  });

  // Build tree structure
  comments.forEach(comment => {
    const node = map.get(comment.id)!;
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Single comment component with reply functionality
interface CommentItemProps {
  comment: CommentNode;
  depth: number;
  onReply: (comment: Comment) => void;
  collapsedThreads: Set<string>;
  toggleCollapse: (id: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth,
  onReply,
  collapsedThreads,
  toggleCollapse,
}) => {
  const isCollapsed = collapsedThreads.has(comment.id);
  const hasChildren = comment.children.length > 0;
  const maxDepth = 4; // Max visual nesting depth

  return (
    <div className="relative">
      {/* Thread connector line for nested comments */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{
            backgroundColor: 'var(--term-border)',
            marginLeft: `${Math.min(depth - 1, maxDepth - 1) * 24 + 11}px`,
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 border mb-2"
        style={{
          marginLeft: `${Math.min(depth, maxDepth) * 24}px`,
          borderColor: depth === 0 ? 'var(--term-border)' : 'var(--term-border)',
          backgroundColor: depth === 0 ? 'var(--term-selection)' : 'transparent',
          borderLeftColor: depth > 0 ? 'var(--term-primary)' : 'var(--term-border)',
          borderLeftWidth: depth > 0 ? '2px' : '1px',
        }}
      >
        {/* Comment Header */}
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="font-medium text-sm" style={{ color: 'var(--term-secondary)' }}>
            {comment.author}
          </span>
          <span className="text-xs" style={{ color: 'var(--term-muted)' }}>
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
          className="prose prose-invert prose-sm max-w-none markdown-content text-sm"
          style={{ color: 'var(--term-foreground)' }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
        />

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onReply(comment)}
            className="text-xs touch-manipulation"
            style={{ color: 'var(--term-muted)' }}
          >
            Reply
          </button>
          {hasChildren && (
            <button
              onClick={() => toggleCollapse(comment.id)}
              className="text-xs touch-manipulation"
              style={{ color: 'var(--term-muted)' }}
            >
              {isCollapsed ? `[+] ${comment.children.length} replies` : '[-] Collapse'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Nested Replies */}
      <AnimatePresence>
        {hasChildren && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {comment.children.map(child => (
              <CommentItem
                key={child.id}
                comment={child}
                depth={depth + 1}
                onReply={onReply}
                collapsedThreads={collapsedThreads}
                toggleCollapse={toggleCollapse}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Comment Section Component
 * Displays comments for a blog post with a TUI aesthetic
 * Supports nested replies with thread visualization
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

  // Reply state
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Collapse state
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());

  // Build comment tree from flat list
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

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

  // Handle reply button
  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
    setContent('');
    setShowPreview(false);
    // Scroll to editor
    document.getElementById('comment-editor')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Toggle collapse
  const toggleCollapse = useCallback((id: string) => {
    setCollapsedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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
        parentId: replyingTo?.id,
      });

      // Add to list
      setComments(prev => [...prev, newComment]);
      setContent('');
      setShowPreview(false);
      setReplyingTo(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [postSlug, content, authorName, replyingTo]);

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

      {/* Comments List - Threaded */}
      {!isLoading && !error && (
        <div className="mb-8">
          {commentTree.length === 0 ? (
            <div className="py-4" style={{ color: 'var(--term-muted)' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            commentTree.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                onReply={handleReply}
                collapsedThreads={collapsedThreads}
                toggleCollapse={toggleCollapse}
              />
            ))
          )}
        </div>
      )}

      {/* Comment Editor */}
      <div
        id="comment-editor"
        className="p-4 border"
        style={{
          borderColor: replyingTo ? 'var(--term-primary)' : 'var(--term-border)',
          backgroundColor: 'var(--term-background)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--term-primary)' }}>
            {replyingTo ? `REPLY TO ${replyingTo.author.toUpperCase()}` : 'ADD COMMENT'}
          </h3>
          {replyingTo && (
            <button
              onClick={cancelReply}
              className="text-xs touch-manipulation"
              style={{ color: 'var(--term-muted)' }}
            >
              Cancel Reply
            </button>
          )}
        </div>

        {/* Show quoted text when replying */}
        {replyingTo && (
          <div
            className="mb-4 p-2 text-sm border-l-2"
            style={{
              borderColor: 'var(--term-muted)',
              backgroundColor: 'var(--term-selection)',
              color: 'var(--term-muted)',
            }}
          >
            <div className="truncate">
              {replyingTo.content.substring(0, 100)}
              {replyingTo.content.length > 100 && '...'}
            </div>
          </div>
        )}

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
                fontSize: '16px',
              }}
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm" style={{ color: 'var(--term-muted)' }}>
                {replyingTo ? 'Reply' : 'Comment'} (Markdown supported)
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
                placeholder={replyingTo ? 'Write your reply...' : 'Write your comment here...'}
                rows={5}
                maxLength={10000}
                className="w-full p-2 bg-transparent border outline-none font-mono text-sm resize-y"
                style={{
                  color: 'var(--term-foreground)',
                  borderColor: 'var(--term-border)',
                  fontSize: '16px',
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
              {isSubmitting ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
