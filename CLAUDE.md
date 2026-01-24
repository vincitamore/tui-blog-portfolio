# AMORE.BUILD (tui-blog)

Terminal-style portfolio and blog application that mimics a real CLI in the browser.

**Live:** https://amore.build
**Status:** Production - Deployed & Active

## Collaboration Context

This project is part of Alex's broader development ecosystem. For collaboration style, intellectual coordinates, and cross-project awareness:

- **Voice & style**: See `C:\Users\AlexMoyer\Documents\claude-org\context\voice.md`
- **Project relationships**: See `C:\Users\AlexMoyer\Documents\claude-org\context\project-map.md`
- **Organization system**: Use `/org` skill for captures, knowledge distillation, and task tracking
- **After significant work**: Consider whether insights should be captured via `/org learn <topic>`

> If `claude-org` doesn't exist yet, use `claude-misc` as the path.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite |
| State | XState (FSM) |
| Styling | TailwindCSS, Framer Motion |
| Backend | Express.js |
| Storage | JSON files (no database) |
| Auth | SHA-256 token, in-memory sessions |
| Deploy | PM2, Nginx, Ubuntu (178.156.160.155) |

## Quick Start

```bash
pnpm dev              # Frontend + API
pnpm dev:vite         # Frontend only (5173)
pnpm dev:api          # API only (3001)
pnpm build            # Production build
```

## Key Commands (in-app)

```
help, ls, cd <section>, portfolio, blog, about
theme [name]          # 23 themes available
neofetch, contact, skills, clear
sudo admin            # Admin login
```

## Project Structure

```
src/
├── app/              # Main App component
├── features/         # blog/, portfolio/, about/
├── machines/         # XState FSMs (appMachine, blogMachine, portfolioMachine)
├── shared/
│   ├── lib/          # commands.ts, themes.ts, auth.ts, api.ts, markdown.ts
│   ├── hooks/        # useKeyboard, useTheme
│   └── ui/           # terminal/, editor/, tui/ components
server/
└── api.ts            # Express REST API
content/
├── blog.json         # Blog posts
├── portfolio.json    # Projects
└── admin.json        # Admin password hash
```

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET/POST | /api/blog | POST: Yes | Blog CRUD |
| PUT/DELETE | /api/blog/:slug | Yes | Update/delete post |
| GET/POST | /api/portfolio | POST: Yes | Portfolio CRUD |
| POST | /api/portfolio/reorder | Yes | Reorder projects |
| POST | /api/auth/login | No | Get session token |

## Key Patterns

- **XState FSM** for navigation state (prevents invalid transitions)
- **Command registry** in commands.ts (extensible)
- **23 themes** via CSS variables
- **Custom TUI markdown** renderer (not standard HTML)
- **Mobile detection** for in-app browsers (Twitter, FB, IG, LinkedIn)

## Admin Access

Default password: "password" (change in production)
- Create/edit/delete blog posts and projects
- TUI editor with nano-style keybindings
- Visitor logging (IP tracking)

## Notes

- PWA enabled (works offline)
- SSL via Let's Encrypt (valid until Feb 2026)
- Content stored in JSON, no database needed
