import { assign, createMachine, type ActorRefFrom } from 'xstate';
import { searchPosts } from '../lib/blogSearch';

/**
 * Blog post metadata type
 */
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content?: string;
  tags?: string[];
}

/**
 * Context for the blog machine
 */
export interface BlogContext {
  posts: BlogPost[];
  selectedIndex: number;
  currentPost: BlogPost | null;
  searchQuery: string;
  filteredPosts: BlogPost[];
  isSearching: boolean;
}

/**
 * Events for the blog machine
 */
export type BlogEvent =
  | { type: 'KEY_UP' }
  | { type: 'KEY_DOWN' }
  | { type: 'SELECT' }
  | { type: 'BACK' }
  | { type: 'SEARCH'; query: string }
  | { type: 'TOGGLE_SEARCH' }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'LOAD_POSTS'; posts: BlogPost[] };

/**
 * Blog states
 */
export type BlogStateValue = 'list' | 'viewing' | 'searching';

/**
 * ActorRef type for the blog machine
 */
export type BlogActorRef = ActorRefFrom<typeof blogMachine>;

/**
 * XState machine for blog navigation
 *
 * States:
 * - list: Browsing blog posts list
 * - viewing: Reading a single post
 * - searching: Filtering posts by search query
 */
export const blogMachine = createMachine({
  id: 'blogMachine',
  initial: 'list',
  context: {
    posts: [],
    selectedIndex: 0,
    currentPost: null,
    searchQuery: '',
    filteredPosts: [],
    isSearching: false,
  } as BlogContext,
  states: {
    list: {
      on: {
        KEY_UP: {
          actions: assign({
            selectedIndex: ({ context }) => Math.max(0, context.selectedIndex - 1),
          }),
        },
        KEY_DOWN: {
          actions: assign({
            selectedIndex: ({ context }) => {
              const posts = context.searchQuery ? context.filteredPosts : context.posts;
              return Math.min(posts.length - 1, context.selectedIndex + 1);
            },
          }),
        },
        SELECT: {
          target: 'viewing',
          guard: ({ context }) => {
            const posts = context.searchQuery ? context.filteredPosts : context.posts;
            return posts.length > 0;
          },
          actions: assign({
            currentPost: ({ context }) => {
              const posts = context.searchQuery ? context.filteredPosts : context.posts;
              return posts[context.selectedIndex] || null;
            },
          }),
        },
        TOGGLE_SEARCH: {
          target: 'searching',
          actions: assign({
            isSearching: () => true,
          }),
        },
        SEARCH: {
          actions: assign({
            searchQuery: ({ event }) => event.query,
            filteredPosts: ({ context, event }) => searchPosts(context.posts, event.query),
            selectedIndex: () => 0,
          }),
        },
        CLEAR_SEARCH: {
          actions: assign({
            searchQuery: () => '',
            filteredPosts: ({ context }) => context.posts,
            selectedIndex: () => 0,
          }),
        },
        LOAD_POSTS: {
          actions: assign({
            posts: ({ event }) => event.posts,
            filteredPosts: ({ event }) => event.posts,
          }),
        },
        BACK: {}, // Handled by parent (app) machine
      },
    },
    viewing: {
      on: {
        BACK: {
          target: 'list',
          actions: assign({
            currentPost: () => null,
          }),
        },
        KEY_UP: {},
        KEY_DOWN: {},
        SELECT: {},
      },
    },
    searching: {
      on: {
        SEARCH: {
          actions: assign({
            searchQuery: ({ event }) => event.query,
            filteredPosts: ({ context, event }) => searchPosts(context.posts, event.query),
            selectedIndex: () => 0,
          }),
        },
        BACK: {
          target: 'list',
          actions: assign({
            isSearching: () => false,
          }),
        },
        SELECT: {
          target: 'list',
          actions: assign({
            isSearching: () => false,
          }),
        },
        KEY_UP: {},
        KEY_DOWN: {},
      },
    },
  },
});
