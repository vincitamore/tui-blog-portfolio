/**
 * Markdown renderer using marked
 */

import { marked } from 'marked';

// Configure marked for security and styling
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

/**
 * Render markdown string to HTML
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  return marked.parse(content) as string;
}

/**
 * Strip markdown to plain text (for excerpts)
 */
export function stripMarkdown(content: string): string {
  if (!content) return '';
  return content
    .replace(/#{1,6}\s?/g, '') // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
    .replace(/[-*+]\s/g, '') // List markers
    .replace(/\n{2,}/g, ' ') // Multiple newlines
    .trim();
}


