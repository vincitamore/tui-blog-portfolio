import React from 'react';
import { format } from 'date-fns';
import type { BlogPost } from '../machines/blogMachine';

interface BlogPostViewProps {
  post: BlogPost;
}

/**
 * Full blog post view component.
 * Displays the complete post content with TUI styling.
 */
const BlogPostView: React.FC<BlogPostViewProps> = ({ post }) => {
  const formattedDate = format(new Date(post.date), 'MMMM dd, yyyy');

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8 pb-4 border-b border-ansi-green/30">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <time className="text-sm text-ansi-green/60 font-mono">{formattedDate}</time>
      </header>
      <div className="prose prose-invert prose-green max-w-none">
        {post.content ? (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <p className="text-ansi-green/80">{post.excerpt}</p>
        )}
      </div>
      <footer className="mt-8 pt-4 border-t border-ansi-green/30 text-center text-xs text-ansi-green/60">
        Press Esc to return to post list
      </footer>
    </article>
  );
};

export default BlogPostView;



