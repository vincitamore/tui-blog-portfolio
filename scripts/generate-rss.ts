/**
 * Generate RSS feed for blog posts.
 * Run with: npx tsx scripts/generate-rss.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const SITE_URL = process.env.SITE_URL || 'https://your-domain.com';
const SITE_TITLE = 'TUI Portfolio Blog';
const SITE_DESCRIPTION = 'A terminal-inspired blog about development and technology';

// Sample posts - in production, these would be loaded from MDX files
const posts = [
  {
    slug: 'welcome-to-tui-blog',
    title: 'Welcome to the TUI Blog',
    date: '2025-11-25',
    excerpt:
      'An introduction to this terminal-inspired portfolio and blog. Learn about the tech stack and design philosophy.',
  },
  {
    slug: 'building-keyboard-nav',
    title: 'Building Keyboard-First Navigation',
    date: '2025-11-24',
    excerpt:
      'How to create accessible, keyboard-driven navigation for web applications using XState and React hooks.',
  },
  {
    slug: 'tui-aesthetics',
    title: 'Achieving TUI Aesthetics on the Web',
    date: '2025-11-23',
    excerpt:
      'Design techniques for creating authentic terminal-style interfaces using modern CSS and web technologies.',
  },
];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRss(): string {
  const now = new Date().toUTCString();

  const items = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

const rss = generateRss();
const outputPath = join(process.cwd(), 'public', 'rss.xml');
writeFileSync(outputPath, rss);
console.log(`RSS feed generated at ${outputPath}`);



