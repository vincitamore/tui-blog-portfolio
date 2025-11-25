import type { BlogPost } from '../machines/blogMachine';

/**
 * Sample blog posts for development.
 * In production, these would be loaded from MDX files.
 */
export const samplePosts: BlogPost[] = [
  {
    slug: 'welcome-to-tui-blog',
    title: 'Welcome to the TUI Blog',
    date: '2025-11-25',
    excerpt:
      'An introduction to this terminal-inspired portfolio and blog. Learn about the tech stack and design philosophy behind this unique web experience.',
    content: `
      <h2>Welcome!</h2>
      <p>This blog is built with a Terminal User Interface (TUI) aesthetic, bringing the nostalgic feel of classic terminal applications to the modern web.</p>
      <h3>Tech Stack</h3>
      <ul>
        <li><strong>React 18</strong> - For building the UI</li>
        <li><strong>XState</strong> - For state management with finite state machines</li>
        <li><strong>Tailwind CSS</strong> - For TUI-style styling</li>
        <li><strong>Vite</strong> - For fast development and building</li>
      </ul>
      <h3>Features</h3>
      <p>Navigate using arrow keys or vim-style h/j/k/l. Press Enter to select, Escape to go back.</p>
    `,
  },
  {
    slug: 'building-keyboard-nav',
    title: 'Building Keyboard-First Navigation',
    date: '2025-11-24',
    excerpt:
      'How to create accessible, keyboard-driven navigation for web applications using XState and React hooks.',
    content: `
      <h2>Keyboard-First Design</h2>
      <p>True TUI applications are designed for keyboard navigation first. Here's how we achieve that:</p>
      <h3>State Machine Approach</h3>
      <p>Using XState, we model our entire navigation as a finite state machine. This gives us:</p>
      <ul>
        <li>Predictable state transitions</li>
        <li>Easy testing</li>
        <li>Visual debugging tools</li>
      </ul>
      <h3>Keyboard Hook</h3>
      <p>A custom useKeyboard hook captures all keyboard events and translates them into machine events.</p>
    `,
  },
  {
    slug: 'tui-aesthetics',
    title: 'Achieving TUI Aesthetics on the Web',
    date: '2025-11-23',
    excerpt:
      'Design techniques for creating authentic terminal-style interfaces using modern CSS and web technologies.',
    content: `
      <h2>The TUI Look</h2>
      <p>Creating an authentic terminal feel requires attention to several details:</p>
      <h3>Typography</h3>
      <p>Monospace fonts are essential. We use Courier New with a fallback stack for cross-platform consistency.</p>
      <h3>Color Palette</h3>
      <p>Classic green-on-black (#00ff00 on #000000) evokes early computer terminals. We add subtle glow effects for depth.</p>
      <h3>Borders and Boxes</h3>
      <p>ASCII-style borders using CSS create the characteristic TUI frame look.</p>
    `,
  },
];

/**
 * Load blog posts (currently returns sample data).
 * TODO: Integrate with MDX loader for real content.
 */
export async function loadBlogPosts(): Promise<BlogPost[]> {
  // Simulate async loading
  return Promise.resolve(samplePosts);
}

/**
 * Get a single post by slug.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await loadBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}



