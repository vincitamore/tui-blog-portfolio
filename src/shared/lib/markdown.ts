/**
 * TUI-Flavored Markdown Renderer
 * 
 * Uses ASCII/Unicode box-drawing characters for a terminal aesthetic
 * Includes syntax highlighting via highlight.js with theme-aware colors
 */

import { marked, Renderer, type Tokens } from 'marked';
import hljs from 'highlight.js';

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

// Callout type mappings
const CALLOUT_TYPES: Record<string, { icon: string; colorClass: string }> = {
  note: { icon: '[i]', colorClass: 'info' },
  info: { icon: '[i]', colorClass: 'info' },
  tip: { icon: '[✓]', colorClass: 'success' },
  warning: { icon: '[!]', colorClass: 'warning' },
  danger: { icon: '[✗]', colorClass: 'error' },
};

// Blockquotes with pipe characters + callout support
// Syntax: > {note} **Title**\n> Body text
tuiRenderer.blockquote = function({ tokens }: Tokens.Blockquote): string {
  const text = this.parser.parse(tokens);

  // Check for callout syntax: {type} at the start of content
  const calloutMatch = text.match(/^\s*<p[^>]*>\s*\{(\w+)\}\s*/);
  if (calloutMatch) {
    const type = calloutMatch[1].toLowerCase();
    const callout = CALLOUT_TYPES[type];
    if (callout) {
      // Strip the {type} tag from content
      const content = text.replace(/\{(\w+)\}\s*/, '');
      return `<blockquote class="tui-callout tui-callout-${callout.colorClass}"><div class="tui-callout-indicator"><span class="tui-callout-icon">${callout.icon}</span><span class="tui-callout-type">${type}</span></div><div class="tui-callout-content">${content}</div></blockquote>`;
    }
  }

  return `<blockquote class="tui-blockquote"><span class="tui-blockquote-border"></span><div class="tui-blockquote-content">${text}</div></blockquote>`;
};

// Code blocks with syntax highlighting
tuiRenderer.code = function({ text, lang }: Tokens.Code): string {
  let highlightedCode: string;
  let detectedLang = lang || '';
  
  if (lang && hljs.getLanguage(lang)) {
    try {
      const result = hljs.highlight(text, { language: lang, ignoreIllegals: true });
      highlightedCode = result.value;
    } catch {
      highlightedCode = escapeHtml(text);
    }
  } else if (lang) {
    // Try auto-detection if specified language not found
    try {
      const result = hljs.highlightAuto(text);
      highlightedCode = result.value;
      detectedLang = result.language || lang;
    } catch {
      highlightedCode = escapeHtml(text);
    }
  } else {
    highlightedCode = escapeHtml(text);
  }
  
  const langLabel = detectedLang ? `<span class="tui-code-lang">${detectedLang}</span>` : '';
  
  return `<div class="tui-codeblock">
<div class="tui-code-header"><span class="tui-code-border-char">┌</span>${langLabel}</div>
<pre class="tui-code-content"><code class="hljs">${highlightedCode}</code></pre>
<div class="tui-code-footer"><span class="tui-code-border-char">└</span></div>
</div>`;
};

// Helper to escape HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Inline code
tuiRenderer.codespan = function({ text }: Tokens.Codespan): string {
  return `<code class="tui-inline-code">${text}</code>`;
};

// Horizontal rule
tuiRenderer.hr = function(): string {
  return `<div class="tui-hr"></div>`;
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

// Tables with box-drawing borders
tuiRenderer.table = function({ header, rows }: Tokens.Table): string {
  // Render header cells
  const headerCells = header.map(cell => {
    const text = this.parser.parseInline(cell.tokens);
    return `<th class="tui-table-header">${text}</th>`;
  }).join('');

  // Render body rows
  const bodyRows = rows.map(row => {
    const cells = row.map(cell => {
      const text = this.parser.parseInline(cell.tokens);
      return `<td class="tui-table-cell">${text}</td>`;
    }).join('');
    return `<tr class="tui-table-row">${cells}</tr>`;
  }).join('');

  return `<div class="tui-table-wrapper">
<table class="tui-table">
<thead><tr class="tui-table-header-row">${headerCells}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</div>`;
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
