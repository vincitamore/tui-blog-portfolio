import Fuse, { type IFuseOptions } from 'fuse.js';
import type { BlogPost } from '../machines/blogMachine';

/**
 * Fuse.js configuration for blog post search.
 */
const fuseOptions: IFuseOptions<BlogPost> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'excerpt', weight: 0.3 },
    { name: 'content', weight: 0.2 },
    { name: 'slug', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

/**
 * Create a Fuse search index for blog posts.
 */
export function createSearchIndex(posts: BlogPost[]): Fuse<BlogPost> {
  return new Fuse(posts, fuseOptions);
}

/**
 * Search blog posts using Fuse.js.
 *
 * @param posts - All blog posts
 * @param query - Search query string
 * @returns Filtered and ranked blog posts
 */
export function searchPosts(posts: BlogPost[], query: string): BlogPost[] {
  if (!query.trim()) {
    return posts;
  }

  const fuse = createSearchIndex(posts);
  const results = fuse.search(query);

  return results.map((result) => result.item);
}
