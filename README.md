# TUI Blog Portfolio

> A terminal-style portfolio and blog web application that looks and feels like a real terminal. Built with React, TypeScript, Vite, TailwindCSS, and XState for an authentic command-line experience in the browser.

[![Live Demo](https://img.shields.io/badge/demo-amore.build-bd93f9?style=for-the-badge)](https://amore.build)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

## Overview

TUI Blog Portfolio is an interactive, terminal-emulating web application that showcases projects, blog posts, and personal information through a nostalgic command-line interface. Users interact via typed commands or clickable elements, navigate with keyboard shortcuts, and experience authentic terminal aesthetics complete with blinking cursors, customizable themes, and a 3D window effect.

**Live Demo**: [amore.build](https://amore.build)

## Features

### Terminal Experience
- **Real Terminal Feel**: Command input with blinking cursor, command history (↑/↓), and authentic prompt styling
- **23 Color Themes**: Including Dracula (default), Matrix, Monokai, Nord, Tokyo Night, Gruvbox, Catppuccin, Rosé Pine, and more
- **3D Window Effect**: Floating terminal window with macOS-style controls and ambient glow
- **Responsive Design**: Works on desktop and mobile with touch support

### Commands
```bash
help              # Show all available commands
ls, dir           # List available sections
cd <section>      # Navigate to portfolio, blog, or about
portfolio         # Open portfolio viewer
blog              # Open blog reader
about             # View about page
theme [name]      # Change or list themes (23 available!)
neofetch          # Display system information
contact           # Show contact information
skills            # List technical skills
clear, cls        # Clear terminal
```

### Admin Features
Login with `sudo admin` to unlock:
- **Create/Edit/Delete** blog posts and portfolio projects
- **Reorder Projects** with Shift+J/K in the portfolio
- **TUI Editor** with nano-style keybindings (Ctrl+S save, Ctrl+X exit)

### Content Management
- **Lightweight API**: Express.js server saves to JSON files (no database required)
- **Markdown Support**: Full markdown rendering for blog posts
- **Real-time Updates**: Changes persist immediately

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Terminal Window                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  visitor@amore.build:~$                                   │  │
│  │                                                           │  │
│  │  ╔═══════════════════════════════════════════════════╗   │  │
│  │  ║  AMORE.BUILD - Welcome to my terminal portfolio   ║   │  │
│  │  ╚═══════════════════════════════════════════════════╝   │  │
│  │                                                           │  │
│  │  > portfolio    blog    about                             │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | TailwindCSS, CSS Variables, Framer Motion |
| State | XState FSM, React Hooks |
| Backend | Express.js, JSON file storage |
| Fonts | Cascadia Mono |

## Quick Start

### Prerequisites
- Node.js v18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/vincitamore/tui-blog-portfolio.git
cd tui-blog-portfolio

# Install dependencies
pnpm install

# Start development server (frontend + API)
pnpm dev
```

The app runs at `http://localhost:5173` with the API at `http://localhost:3001`.

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + API server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm type-check` | TypeScript type checking |
| `pnpm lint` | ESLint check |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |

## Project Structure

```
src/
├── app/                  # Main App component
├── features/
│   ├── blog/            # Blog TUI application
│   ├── portfolio/       # Portfolio TUI application
│   └── about/           # About TUI application
├── shared/
│   ├── lib/
│   │   ├── commands.ts  # Terminal command parser
│   │   ├── themes.ts    # 23 terminal themes
│   │   ├── api.ts       # API client
│   │   └── auth.ts      # Admin authentication
│   └── ui/
│       ├── terminal/    # Terminal & TerminalWindow components
│       ├── editor/      # TUI Editor (nano-style)
│       └── tui/         # Reusable TUI components
├── machines/            # XState state machines
server/
├── api.ts               # Express API server
content/
├── blog.json            # Blog posts data
└── portfolio.json       # Portfolio projects data
```

## Themes

Switch themes with `theme <name>`:

| Theme | Style |
|-------|-------|
| dracula | Purple/pink (default) |
| matrix | Classic green on black |
| monokai | Warm syntax colors |
| nord | Arctic blue palette |
| tokyonight | Night city blues |
| gruvbox | Retro warm tones |
| synthwave | Neon 80s aesthetic |
| catppuccin | Pastel Mocha |
| solarized | Solarized Dark |
| onedark | Atom One Dark |
| nightowl | Dark blue |
| rosepine | Soft rose tones |
| everforest | Forest greens |
| kanagawa | Japanese wave |
| palenight | Material purple |
| horizon | Warm sunset |
| cobalt | Bright cobalt |
| ayu | Ayu Mirage |
| amber | Retro CRT amber |
| github | GitHub Dark |
| vscode | VS Code Dark+ |
| oceanicnext | Ocean blues |

## Admin Mode

1. Type `sudo admin` in the terminal
2. Enter the password when prompted
3. Admin features unlock:
   - `[n]` New post/project
   - `[e]` Edit when viewing
   - `[d]` Delete when viewing
   - `[Shift+J/K]` Reorder projects

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blog` | List all posts |
| POST | `/api/blog` | Create post |
| PUT | `/api/blog/:slug` | Update post |
| DELETE | `/api/blog/:slug` | Delete post |
| GET | `/api/portfolio` | List projects |
| POST | `/api/portfolio` | Create project |
| PUT | `/api/portfolio/:id` | Update project |
| DELETE | `/api/portfolio/:id` | Delete project |
| POST | `/api/portfolio/reorder` | Reorder projects |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `k` | Navigate up |
| `↓` / `j` | Navigate down |
| `Enter` | Select / Submit |
| `Esc` / `q` | Back / Cancel |
| `Tab` | Next field (editor) |
| `Ctrl+S` | Save (editor) |
| `Ctrl+X` | Exit (editor) |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with passion by [Qui Vincit](https://amore.build)** | *"Qui vincit, vincit amore"*
