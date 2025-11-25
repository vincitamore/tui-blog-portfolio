import React from 'react';
import { format } from 'date-fns';
import type { BlogPost } from '../machines/blogMachine';

interface BlogPostCardProps {
  post: BlogPost;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Blog post card component for the post list.
 * Displays title, date, and excerpt with TUI styling.
 */
const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, isSelected, onClick }) => {
  const formattedDate = format(new Date(post.date), 'MMM dd, yyyy');

  return (
    <div
      role="listitem"
      tabIndex={-1}
      aria-selected={isSelected}
      onClick={onClick}
      className={`p-4 border-2 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'border-ansi-green bg-ansi-green/10 shadow-glow-green'
          : 'border-ansi-green/30 hover:border-ansi-green/60'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-lg font-bold ${isSelected ? 'text-ansi-green' : 'text-ansi-green/80'}`}>
          {isSelected ? '▶ ' : '  '}
          {post.title}
        </h3>
        <span className="text-xs text-ansi-green/60 font-mono">{formattedDate}</span>
      </div>
      <p className="text-sm text-ansi-green/70 line-clamp-2 pl-4">{post.excerpt}</p>
    </div>
  );
};

export default BlogPostCard;



