import React from 'react';
import BlogPostCard from './BlogPostCard';
import type { BlogPost } from '../machines/blogMachine';

interface BlogPostListProps {
  posts: BlogPost[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Blog post list component with keyboard navigation.
 * Displays all posts with selection highlighting.
 */
const BlogPostList: React.FC<BlogPostListProps> = ({ posts, selectedIndex, onSelect }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-ansi-green/60">
        <div className="text-4xl mb-4">📭</div>
        <p>No posts found</p>
      </div>
    );
  }

  return (
    <div role="list" aria-label="Blog posts" className="space-y-2">
      {posts.map((post, index) => (
        <BlogPostCard
          key={post.slug}
          post={post}
          isSelected={index === selectedIndex}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
};

export default BlogPostList;



