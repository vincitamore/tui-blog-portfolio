# Design Decisions Behind This Site

Figured I'd write up some of the technical choices that went into building this thing. Partly for anyone curious, partly so I remember why I did things a certain way when I inevitably come back to this in six months confused.

## Why JSON Files Instead of a Database

This was a deliberate choice. For a personal portfolio/blog with maybe a dozen posts and a handful of projects, spinning up Postgres or even SQLite felt like overkill. The content lives in simple JSON files:

```
content/
  blog.json
  portfolio.json
  admin.json
```

The API just reads and writes to these directly:

```typescript
async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  const filePath = path.join(CONTENT_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}
```

No migrations, no connection pooling, no ORM. Just files. For this scale it's perfectly fine and makes deployment dead simple - just copy the files.

## The Theme System

I wanted themes to feel like actual terminal colorschemes, not just "light mode/dark mode". The solution was CSS variables that get swapped out:

```typescript
export function applyTheme(themeName: string): Theme {
  const theme = themes[themeName] || themes.dracula;
  const root = document.documentElement;
  
  root.style.setProperty('--term-background', theme.colors.background);
  root.style.setProperty('--term-foreground', theme.colors.foreground);
  root.style.setProperty('--term-primary', theme.colors.primary);
  // ... etc
}
```

There's like 20+ themes now - dracula, nord, gruvbox, catppuccin, all the classics. Switching themes is instant since it's just CSS variable updates, no re-render needed.

## TUI Markdown

Standard markdown rendering felt too... web-y. I wanted the rendered output to still feel terminal-native. So I wrote a custom renderer that adds ASCII decorations:

- Headings get `╔═ Title ═╗` style borders
- Lists use tree characters `├─` and `└─`
- Code blocks have accent-colored left borders
- Links render with `[brackets]`

The syntax highlighting respects the current theme too, pulling colors from the CSS variables.

## Authentication

Went with simple session tokens stored in memory on the server. No JWT complexity, no refresh token dance. Login gives you a token, token lives for 24 hours, done.

```typescript
const activeSessions = new Map<string, { createdAt: number }>();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.slice(7);
  const session = activeSessions.get(token);
  
  if (!session || Date.now() - session.createdAt > SESSION_DURATION) {
    return res.status(401).json({ error: 'Session expired' });
  }
  
  next();
}
```

Server restart clears all sessions which is fine for a single-user admin system.

## Mobile Considerations

The whole "keyboard navigation" thing doesn't work on phones, obviously. So there's detection for touch devices that:

- Shows touch-friendly navigation buttons
- Prevents the keyboard from auto-popping up when you tap commands
- Scales the ASCII art to fit smaller viewports

The ASCII banners use responsive font sizes that go down to like 5px on tiny screens. Looks surprisingly decent.

## Stack

- React + TypeScript (Vite for builds)
- Express for the API
- TailwindCSS for styling
- Framer Motion for animations
- PWA support so it works offline

Nothing exotic. The interesting stuff is in the presentation layer, not the architecture.

---

That's the gist of it. Not claiming any of this is "best practice" - it's just what made sense for a personal project of this scope. Sometimes simple is good enough.



