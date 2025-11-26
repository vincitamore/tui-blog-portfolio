/**
 * TUI-Flavored Markdown Renderer
 * 
 * Uses ASCII/Unicode box-drawing characters for a terminal aesthetic
 */

import { marked, Renderer, type Tokens } from 'marked';

// Create a custom TUI-styled renderer
const tuiRenderer = new Renderer();

// Headings with ASCII decoration
tuiRenderer.heading = function({ tokens, depth }: Tokens.Heading): string {
  const text = this.parser.parseInline(tokens);
  const tag = `h${depth}`;
  const prefix = depth === 1 ? '╔═ ' : depth === 2 ? '╠═ ' : '├─ ';
  const suffix = depth === 1 ? ' ═╗' : depth === 2 ? ' ═╣' : ' ─┤';
  return `<${tag} class="tui-heading tui-h${depth}">${prefix}${text}${suffix}</${tag}>`;
};

// Unordered/ordered lists
tuiRenderer.list = function(token: Tokens.List): string {
  const tag = token.ordered ? 'ol' : 'ul';
  const startAttr = token.ordered && token.start !== 1 ? ` start="${token.start}"` : '';
  const className = token.ordered ? 'tui-ordered-list' : 'tui-unordered-list';
  
  // Render each list item
  let body = '';
  for (const item of token.items) {
    body += this.listitem(item);
  }
  
  return `<${tag} class="${className}"${startAttr}>${body}</${tag}>`;
};

// List items with ASCII bullets
tuiRenderer.listitem = function(item: Tokens.ListItem): string {
  const text = this.parser.parse(item.tokens);
  return `<li class="tui-list-item">${text}</li>`;
};

// Blockquotes with pipe characters
tuiRenderer.blockquote = function({ tokens }: Tokens.Blockquote): string {
  const text = this.parser.parse(tokens);
  return `<blockquote class="tui-blockquote">${text}</blockquote>`;
};

// Code blocks with ASCII border
tuiRenderer.code = function({ text, lang }: Tokens.Code): string {
  const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const langLabel = lang ? `<span class="tui-code-lang">[ ${lang} ]</span>` : '';
  return `<div class="tui-codeblock">
    <div class="tui-code-header">┌${'─'.repeat(40)}${langLabel}</div>
    <pre class="tui-code-content"><code>${escapedText}</code></pre>
    <div class="tui-code-footer">└${'─'.repeat(40)}</div>
  </div>`;
};

// Inline code
tuiRenderer.codespan = function({ text }: Tokens.Codespan): string {
  return `<code class="tui-inline-code">‹${text}›</code>`;
};

// Horizontal rule
tuiRenderer.hr = function(): string {
  return `<hr class="tui-hr" />`;
};

// Links with brackets
tuiRenderer.link = function({ href, title, tokens }: Tokens.Link): string {
  const text = this.parser.parseInline(tokens);
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} class="tui-link" target="_blank" rel="noopener noreferrer">[${text}]</a>`;
};

// Strong/bold text
tuiRenderer.strong = function({ tokens }: Tokens.Strong): string {
  const text = this.parser.parseInline(tokens);
  return `<strong class="tui-strong">«${text}»</strong>`;
};

// Emphasis/italic text
tuiRenderer.em = function({ tokens }: Tokens.Em): string {
  const text = this.parser.parseInline(tokens);
  return `<em class="tui-em">/${text}/</em>`;
};

// Paragraph
tuiRenderer.paragraph = function({ tokens }: Tokens.Paragraph): string {
  const text = this.parser.parseInline(tokens);
  return `<p class="tui-paragraph">${text}</p>`;
};

// Configure marked with TUI renderer
marked.setOptions({
  gfm: true,
  breaks: true,
});

marked.use({ renderer: tuiRenderer });

/**
 * Render markdown string to TUI-styled HTML
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
