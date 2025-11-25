# OpenCode TUI Design System

> A comprehensive guide to the Terminal User Interface (TUI) styling, theming, animations, and design philosophies in OpenCode.

---

## Table of Contents

| Section | Description |
|---------|-------------|
| [Overview](#overview) | High-level TUI architecture summary |
| [Technology Stack](#technology-stack) | Core libraries and frameworks |
| [Theming System](#theming-system) | Theme structure, colors, and customization |
| [Color Categories](#color-categories) | Semantic color organization |
| [Built-in Themes](#built-in-themes) | All 24 included themes |
| [Typography & Symbols](#typography--symbols) | Fonts, Unicode, and text styling |
| [Animation System](#animation-system) | Spinners and visual feedback |
| [Layout System](#layout-system) | Flexbox-based terminal layouts |
| [Component Architecture](#component-architecture) | UI primitives and composites |
| [Visual Elements](#visual-elements) | Borders, badges, and decorations |
| [Design Philosophies](#design-philosophies) | Guiding principles |
| [Custom Theme Creation](#custom-theme-creation) | How to create your own themes |

---

## Overview

OpenCode's TUI is built on a custom rendering engine called **OpenTUI** (`@opentui/core` and `@opentui/solid`) combined with **SolidJS** for reactive state management. The UI system provides:

- **Declarative JSX-based terminal rendering** with components like `<box>`, `<text>`, `<scrollbox>`, `<textarea>`, and `<code>`
- **Semantic theming** with 24 built-in color schemes from popular editor themes
- **Dark/Light mode** support with automatic terminal background detection
- **Custom spinner animations** with Knight Rider-style effects
- **Flexbox-based layouts** for responsive terminal interfaces

### File Structure

```
packages/opencode/src/cli/cmd/tui/
├── app.tsx                    # Main application entry point
├── component/                 # Reusable UI components
│   ├── border.tsx            # Border character definitions
│   ├── logo.tsx              # ASCII art logo
│   ├── dialog-*.tsx          # Various dialog components
│   └── prompt/               # Input prompt system
├── context/                   # React-style context providers
│   ├── theme.tsx             # Theme management
│   ├── theme/*.json          # 24 theme definition files
│   ├── keybind.tsx           # Keyboard shortcut system
│   └── ...
├── routes/                    # Page-level components
│   ├── home.tsx              # Welcome screen
│   └── session/              # Chat session views
├── ui/                        # Low-level UI primitives
│   ├── dialog.tsx            # Modal dialog system
│   ├── toast.tsx             # Toast notifications
│   ├── spinner.ts            # Animation system
│   └── dialog-*.tsx          # Dialog variants
└── util/                      # Utilities
    ├── clipboard.ts          # System clipboard
    └── editor.ts             # External editor integration
```

---

## Technology Stack

### Core Libraries

| Library | Purpose |
|---------|---------|
| `@opentui/core` | Low-level terminal rendering primitives |
| `@opentui/solid` | SolidJS bindings for OpenTUI |
| `solid-js` | Reactive UI framework |
| `opentui-spinner` | Animation and spinner utilities |

### Rendering Features

```typescript
// From app.tsx - Render configuration
render(
  () => <App />,
  {
    targetFps: 60,           // 60 FPS target
    gatherStats: false,      // Performance monitoring
    exitOnCtrlC: false,      // Custom exit handling
    useKittyKeyboard: true,  // Enhanced keyboard protocol
  },
)
```

### Primitives Available

| Component | Description |
|-----------|-------------|
| `<box>` | Flexbox container element |
| `<text>` | Styled text rendering |
| `<scrollbox>` | Scrollable container with smooth scrolling |
| `<textarea>` | Multi-line text input |
| `<input>` | Single-line text input |
| `<code>` | Syntax-highlighted code blocks |
| `<spinner>` | Animated loading indicators |

---

## Theming System

### Theme Structure

Themes are defined as JSON files with a consistent schema:

```typescript
// From context/theme.tsx
type ThemeColors = {
  // Primary palette
  primary: RGBA          // Main accent color
  secondary: RGBA        // Secondary accent
  accent: RGBA           // Highlight color
  
  // Status colors
  error: RGBA            // Error/destructive
  warning: RGBA          // Warning states
  success: RGBA          // Success states
  info: RGBA             // Information
  
  // Text colors
  text: RGBA             // Primary text
  textMuted: RGBA        // Secondary/dimmed text
  selectedListItemText: RGBA  // Selected item text
  
  // Background colors
  background: RGBA       // Main background
  backgroundPanel: RGBA  // Panel/card background
  backgroundElement: RGBA // Interactive element background
  backgroundMenu: RGBA   // Menu background
  
  // Border colors
  border: RGBA           // Default borders
  borderActive: RGBA     // Active/focused borders
  borderSubtle: RGBA     // Subtle/dim borders
  
  // Diff colors (18 properties)
  diffAdded: RGBA
  diffRemoved: RGBA
  diffContext: RGBA
  // ... etc
  
  // Markdown colors (16 properties)
  markdownText: RGBA
  markdownHeading: RGBA
  markdownLink: RGBA
  // ... etc
  
  // Syntax highlighting (9 properties)
  syntaxComment: RGBA
  syntaxKeyword: RGBA
  syntaxFunction: RGBA
  // ... etc
}
```

### Theme JSON Format

```json
{
  "$schema": "https://opencode.ai/theme.json",
  "defs": {
    "colorName": "#hexvalue",
    "anotherColor": "#hexvalue"
  },
  "theme": {
    "primary": { "dark": "colorName", "light": "#hexvalue" },
    "secondary": { "dark": "#hexvalue", "light": "colorName" }
  }
}
```

### Features

1. **Color References**: Define colors in `defs` and reference them by name
2. **Dark/Light Variants**: Each color can have separate dark and light mode values
3. **Transparent Backgrounds**: Support for `"transparent"` or `"none"` values
4. **Hex Colors**: Standard `#RRGGBB` or `#RRGGBBAA` formats

---

## Color Categories

### Semantic Colors

| Category | Colors | Purpose |
|----------|--------|---------|
| **Primary** | `primary`, `secondary`, `accent` | Brand/accent colors |
| **Status** | `error`, `warning`, `success`, `info` | Feedback states |
| **Text** | `text`, `textMuted`, `selectedListItemText` | Typography |
| **Background** | `background`, `backgroundPanel`, `backgroundElement`, `backgroundMenu` | Surface colors |
| **Border** | `border`, `borderActive`, `borderSubtle` | Element boundaries |

### Diff Colors (18 colors)

| Color | Purpose |
|-------|---------|
| `diffAdded` | Added line text |
| `diffRemoved` | Removed line text |
| `diffContext` | Context line text |
| `diffHunkHeader` | Diff section header |
| `diffHighlightAdded` | Inline add highlight |
| `diffHighlightRemoved` | Inline remove highlight |
| `diffAddedBg` | Added line background |
| `diffRemovedBg` | Removed line background |
| `diffContextBg` | Context line background |
| `diffLineNumber` | Line number text |
| `diffAddedLineNumberBg` | Added line number background |
| `diffRemovedLineNumberBg` | Removed line number background |

### Markdown Colors (16 colors)

| Color | Purpose |
|-------|---------|
| `markdownText` | Body text |
| `markdownHeading` | Header text (h1-h6) |
| `markdownLink` | Link URLs |
| `markdownLinkText` | Link text |
| `markdownCode` | Inline code |
| `markdownBlockQuote` | Block quotes |
| `markdownEmph` | Italic text |
| `markdownStrong` | Bold text |
| `markdownHorizontalRule` | HR elements |
| `markdownListItem` | List bullets |
| `markdownListEnumeration` | Numbered list items |
| `markdownImage` | Image markers |
| `markdownImageText` | Image alt text |
| `markdownCodeBlock` | Code block text |

### Syntax Highlighting (9 colors)

| Color | Applies To |
|-------|------------|
| `syntaxComment` | Comments (italicized) |
| `syntaxKeyword` | Keywords, control flow |
| `syntaxFunction` | Function names, methods |
| `syntaxVariable` | Variables, parameters |
| `syntaxString` | String literals |
| `syntaxNumber` | Numbers, booleans |
| `syntaxType` | Type names, classes |
| `syntaxOperator` | Operators, delimiters |
| `syntaxPunctuation` | Brackets, punctuation |

---

## Built-in Themes

OpenCode ships with **24 curated themes** covering a wide range of aesthetics:

### Classic Editor Themes

| Theme | Style | Description |
|-------|-------|-------------|
| **opencode** | Default | Custom warm amber/purple palette |
| **monokai** | Dark | Classic Sublime Text theme |
| **one-dark** | Dark | Atom editor's iconic theme |
| **dracula** | Dark | Popular purple-accented theme |
| **github** | Light/Dark | GitHub's code view colors |
| **solarized** | Light/Dark | Ethan Schoonover's precision theme |
| **gruvbox** | Warm | Retro groove with warm colors |
| **nord** | Cool | Arctic, bluish color palette |

### Modern Editor Themes

| Theme | Style | Description |
|-------|-------|-------------|
| **tokyonight** | Dark | Inspired by Tokyo city lights |
| **catppuccin** | Pastel | Soothing pastel color palette |
| **rosepine** | Dark | All-natural pine, faux fur, soho vibes |
| **kanagawa** | Dark | Inspired by Katsushika Hokusai's art |
| **ayu** | Light/Dark | Mirage-style warm colors |
| **nightowl** | Dark | Sarah Drasner's Night Owl theme |
| **everforest** | Green | Comfortable green-based palette |
| **palenight** | Purple | Material palenight variant |
| **vesper** | Dark | Minimal dark theme |
| **flexoki** | Warm | Inky, warm color scheme |

### Specialty Themes

| Theme | Style | Description |
|-------|-------|-------------|
| **matrix** | Green | The Matrix green-on-black |
| **synthwave84** | Neon | 80s retrofuturism, neon colors |
| **cobalt2** | Blue | Wes Bos's Cobalt2 theme |
| **material** | Various | Material Design colors |
| **aura** | Purple | Soft purple aesthetic |
| **zenburn** | Muted | Low-contrast theme for comfort |

### Theme Color Examples

#### OpenCode Theme (Default)

```json
{
  "defs": {
    "darkStep9": "#fab283",     // Primary: Warm amber
    "darkAccent": "#9d7cd8",    // Accent: Purple
    "darkSecondary": "#5c9cf5", // Secondary: Blue
    "darkStep12": "#eeeeee",    // Text: Light gray
    "darkStep1": "#0a0a0a"      // Background: Near black
  }
}
```

#### Matrix Theme

```json
{
  "defs": {
    "rainGreen": "#2eff6a",     // Primary: Bright green
    "rainGreenDim": "#1cc24b",  // Dimmed green
    "rainGreenHi": "#62ff94",   // Highlight green
    "matrixInk0": "#0a0e0a"     // Background: Dark green-black
  }
}
```

#### Synthwave 84 Theme

```json
{
  "defs": {
    "cyan": "#36f9f6",          // Primary: Neon cyan
    "pink": "#ff7edb",          // Secondary: Hot pink
    "yellow": "#fede5d",        // Warning: Neon yellow
    "purple": "#b084eb",        // Accent: Electric purple
    "background": "#262335"     // Background: Deep purple
  }
}
```

---

## Typography & Symbols

### ASCII Art Logo

The OpenCode logo is rendered using Unicode block characters:

```typescript
// From component/logo.tsx
const LOGO_LEFT = [
  `                   `,
  `█▀▀█ █▀▀█ █▀▀█ █▀▀▄`,
  `█░░█ █░░█ █▀▀▀ █░░█`,
  `▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀  ▀`
]

const LOGO_RIGHT = [
  `             ▄     `,
  `█▀▀▀ █▀▀█ █▀▀█ █▀▀█`,
  `█░░░ █░░█ █░░█ █▀▀▀`,
  `▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀`
]
```

**Design Notes:**
- Uses full and partial block Unicode characters (`█`, `▀`, `▄`, `░`)
- "OPEN" portion is rendered in muted color, "CODE" in bold text
- Version number displayed below-right

### Unicode Symbols Used

| Symbol | Usage |
|--------|-------|
| `┃` | Vertical border for prompts |
| `╹` | Bottom of vertical border |
| `▀` | Top half block for shadows |
| `•` | Status indicators |
| `▣` | Agent indicator |
| `⬝` | Light square |
| `■` | Filled square (spinner) |
| `◆` `⬥` `⬩` `⬪` | Diamond variants (spinner) |
| `·` | Dot separator |
| `→` | Read indicator |
| `←` | Write indicator |
| `✱` | Search/glob indicator |
| `#` | Shell command |
| `%` | Task indicator |
| `▼` `▶` | Expandable sections |
| `✓` | Completed task |
| `●` | Current item indicator |
| `…` | Truncation |

### Text Attributes

```typescript
// From @opentui/core
enum TextAttributes {
  BOLD,      // Bold text
  ITALIC,    // Italic (where supported)
  UNDERLINE, // Underlined text
  DIM        // Dimmed/muted text
}

// Usage in components
<text attributes={TextAttributes.BOLD}>Bold text</text>
<text fg={theme.textMuted}>Muted text</text>
```

### Styled Text Syntax

```typescript
// Tagged template literal for styled text
import { t, dim, fg } from "@opentui/core"

const placeholder = t`${dim(fg(theme.primary)("  → up/down"))} ${dim(fg("#64748b")("history"))}`
```

---

## Animation System

### Knight Rider Spinner

OpenCode uses a custom "Knight Rider" style animated spinner with trailing effects:

```typescript
// From ui/spinner.ts

interface KnightRiderOptions {
  width?: number              // Number of cells (default: 8)
  style?: "blocks" | "diamonds"  // Character style
  holdStart?: number          // Pause at start (frames)
  holdEnd?: number            // Pause at end (frames)
  color?: ColorInput          // Primary color
  trailSteps?: number         // Trail length (default: 6)
  inactiveFactor?: number     // Dimness of inactive dots
}

// Creates frames like:
// blocks:   "■⬝⬝⬝⬝⬝⬝⬝" → "⬝■⬝⬝⬝⬝⬝⬝" → ...
// diamonds: "⬥·······" → "·◆⬩⬪····" → ...
```

### Animation Features

1. **Bidirectional Movement**: Scanner moves forward, holds, moves backward, holds
2. **Trailing Glow Effect**: Gradient trail behind the active position
3. **Bloom Effect**: Slight brightness boost at the leading edge
4. **Exponential Decay**: Natural-looking trail fade
5. **Fade Transitions**: Smooth fade in/out during hold phases

```typescript
// Trail color generation
export function deriveTrailColors(brightColor: ColorInput, steps = 6): RGBA[] {
  const colors: RGBA[] = []
  for (let i = 0; i < steps; i++) {
    let factor: number
    if (i === 0) factor = 1.0      // Original brightness
    else if (i === 1) factor = 1.2 // Bloom/glare
    else factor = Math.pow(0.6, i - 1)  // Exponential decay
    
    // Apply factor to RGB channels
    colors.push(/* dimmed color */)
  }
  return colors
}
```

### Usage in Prompt

```typescript
// From component/prompt/index.tsx
const spinnerDef = createMemo(() => {
  const color = local.agent.color(local.agent.current().name)
  return {
    frames: createFrames({
      color,
      style: "blocks",
      inactiveFactor: 0.25,
    }),
    color: createColors({
      color,
      style: "blocks",
      inactiveFactor: 0.25,
    }),
  }
})

// Rendered as:
<spinner color={spinnerDef().color} frames={spinnerDef().frames} interval={40} />
```

---

## Layout System

### Flexbox-Based Layouts

OpenCode uses CSS Flexbox-style layouts in the terminal:

```tsx
// Basic flexbox layout
<box flexDirection="column" flexGrow={1} gap={1}>
  <box flexDirection="row" justifyContent="space-between">
    <text>Left</text>
    <text>Right</text>
  </box>
</box>
```

### Layout Properties

| Property | Values | Description |
|----------|--------|-------------|
| `flexDirection` | `row`, `column` | Main axis direction |
| `flexGrow` | number | Growth factor |
| `flexShrink` | number | Shrink factor |
| `flexBasis` | number | Initial size |
| `flexWrap` | `wrap`, `nowrap` | Line wrapping |
| `justifyContent` | `flex-start`, `flex-end`, `center`, `space-between` | Main axis alignment |
| `alignItems` | `flex-start`, `flex-end`, `center` | Cross axis alignment |
| `gap` | number | Spacing between children |

### Spacing Properties

| Property | Description |
|----------|-------------|
| `padding` | All sides |
| `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight` | Individual sides |
| `margin` | External spacing |
| `marginTop`, `marginBottom`, `marginLeft`, `marginRight` | Individual margins |

### Size Constraints

| Property | Description |
|----------|-------------|
| `width`, `height` | Fixed dimensions |
| `maxWidth`, `maxHeight` | Maximum constraints |
| `minHeight` | Minimum height |

### Example: Session Layout

```tsx
// From routes/session/index.tsx
<box flexDirection="row" paddingBottom={1} paddingTop={1} paddingLeft={2} paddingRight={2} gap={2}>
  <box flexGrow={1} gap={1}>
    <Header />
    <scrollbox flexGrow={1} stickyScroll={true} stickyStart="bottom">
      {/* Messages */}
    </scrollbox>
    <Prompt />
  </box>
  <Show when={sidebarVisible()}>
    <Sidebar width={40} />
  </Show>
</box>
```

---

## Component Architecture

### Modal Dialog System

```typescript
// From ui/dialog.tsx
function Dialog(props: { size?: "medium" | "large"; onClose: () => void }) {
  return (
    <box
      width={dimensions().width}
      height={dimensions().height}
      alignItems="center"
      position="absolute"
      paddingTop={dimensions().height / 4}
      backgroundColor={RGBA.fromInts(0, 0, 0, 150)}  // Semi-transparent overlay
    >
      <box
        width={props.size === "large" ? 80 : 60}
        maxWidth={dimensions().width - 2}
        backgroundColor={theme.backgroundPanel}
        paddingTop={1}
      >
        {props.children}
      </box>
    </box>
  )
}
```

### Dialog Stack Management

```typescript
const dialog = useDialog()

// Show a dialog
dialog.replace(() => <DialogModel />)

// Clear all dialogs
dialog.clear()

// Escape key handling (automatic)
```

### Toast Notifications

```typescript
// From ui/toast.tsx
<box
  position="absolute"
  top={2}
  right={2}
  maxWidth={Math.min(60, dimensions().width - 6)}
  paddingLeft={2}
  paddingRight={2}
  paddingTop={1}
  paddingBottom={1}
  backgroundColor={theme.backgroundPanel}
  borderColor={theme[variant]}  // Color based on variant
  border={["left", "right"]}
  customBorderChars={SplitBorder.customBorderChars}
>
  <text attributes={TextAttributes.BOLD}>{title}</text>
  <text fg={theme.text} wrapMode="word">{message}</text>
</box>
```

### Selection Dialog

```typescript
// From ui/dialog-select.tsx
// Features:
// - Fuzzy search with fuzzysort
// - Keyboard navigation (up/down, page up/down)
// - Mouse support (hover, click)
// - Grouped options with categories
// - Current item highlighting
```

---

## Visual Elements

### Border System

```typescript
// From component/border.tsx
export const EmptyBorder = {
  topLeft: "",
  bottomLeft: "",
  vertical: "",
  topRight: "",
  bottomRight: "",
  horizontal: " ",
  bottomT: "",
  topT: "",
  cross: "",
  leftT: "",
  rightT: "",
}

export const SplitBorder = {
  border: ["left", "right"],
  customBorderChars: {
    ...EmptyBorder,
    vertical: "┃",  // Thick vertical line
  },
}
```

### Border Usage Patterns

```tsx
// Message indicator border
<box
  border={["left"]}
  borderColor={color()}
  customBorderChars={SplitBorder.customBorderChars}
>

// Prompt input border
<box
  border={["left"]}
  borderColor={highlight()}
  customBorderChars={{
    ...EmptyBorder,
    vertical: "┃",
    bottomLeft: "╹",  // Rounded bottom
  }}
>

// Shadow effect
<box
  border={["bottom"]}
  borderColor={theme.backgroundElement}
  customBorderChars={{
    ...EmptyBorder,
    horizontal: "▀",  // Top half block creates shadow
  }}
/>
```

### File/Content Badges

```tsx
// MIME type badges
const MIME_BADGE: Record<string, string> = {
  "text/plain": "txt",
  "image/png": "img",
  "image/jpeg": "img",
  "image/gif": "img",
  "image/webp": "img",
  "application/pdf": "pdf",
  "application/x-directory": "dir",
}

// Badge styling
<text>
  <span style={{ bg: accentColor, fg: theme.background }}> {badge} </span>
  <span style={{ bg: theme.backgroundElement, fg: theme.textMuted }}> {filename} </span>
</text>
```

### Status Indicators

```tsx
// MCP server status
<text fg={{
  connected: theme.success,
  failed: theme.error,
  disabled: theme.textMuted,
}[status]}>
  •
</text>

// Agent indicator
<text>
  <span style={{ fg: agentColor }}>▣</span> {agentName}
</text>

// Todo status
<text style={{ fg: todo.status === "in_progress" ? theme.success : theme.textMuted }}>
  [{todo.status === "completed" ? "✓" : " "}] {todo.content}
</text>
```

---

## Design Philosophies

### 1. Terminal-Native Aesthetics

The UI embraces terminal constraints rather than fighting them:

- **Box-drawing characters** for clean borders (`┃`, `╹`, `▀`)
- **Block elements** for visual interest (`█`, `▀`, `▄`, `░`)
- **Semantic symbols** that work in monospace (`•`, `→`, `←`, `✓`)
- **Color-first approach** rather than relying on graphical effects

### 2. Information Density

Maximizes useful information in limited space:

```tsx
// Cost and context shown inline
<text fg={theme.textMuted} wrapMode="none" flexShrink={0}>
  {context()} ({cost()})
</text>

// File changes with additions/deletions
<text fg={theme.diffAdded}>+{item.additions}</text>
<text fg={theme.diffRemoved}>-{item.deletions}</text>
```

### 3. Progressive Disclosure

Complex information is hidden until needed:

- **Collapsible sections** in sidebar (MCP, LSP, Todos, Files)
- **Tool outputs** collapsed by default, expandable
- **Thinking blocks** toggleable
- **Timestamps** optional

### 4. Consistent Color Semantics

Colors have consistent meanings across the interface:

| Color | Semantic Meaning |
|-------|------------------|
| `primary` | Interactive elements, links, prompts |
| `secondary` | User messages, secondary actions |
| `accent` | Highlights, special markers |
| `error` | Errors, destructive actions |
| `warning` | Warnings, pending actions |
| `success` | Success states, active items |
| `textMuted` | Secondary text, disabled states |

### 5. Agent Identity Through Color

Each agent has a distinct color for easy identification:

```typescript
// From context/local.tsx
const AGENT_COLORS = {
  code: theme.secondary,     // Blue-ish
  ask: theme.accent,         // Purple-ish  
  architect: theme.primary,  // Amber/primary
  // Custom agents get colors from palette
}
```

### 6. Responsive Layout

Adapts to terminal size:

```tsx
// Sidebar visibility based on width
const wide = createMemo(() => dimensions().width > 120)
const sidebarVisible = createMemo(() => 
  sidebar() === "show" || (sidebar() === "auto" && wide())
)

// Diff view style based on content width
const style = createMemo(() => ctx.width > 120 ? "split" : "stacked")
```

### 7. Accessibility Through Color Contrast

Automatic contrast handling:

```typescript
// From context/theme.tsx
export function selectedForeground(theme: Theme): RGBA {
  if (theme._hasSelectedListItemText) {
    return theme.selectedListItemText
  }
  
  // Calculate contrast for transparent backgrounds
  if (theme.background.a === 0) {
    const { r, g, b } = theme.primary
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return luminance > 0.5 ? RGBA.fromInts(0, 0, 0) : RGBA.fromInts(255, 255, 255)
  }
  
  return theme.background
}
```

---

## Custom Theme Creation

### Location

Custom themes can be placed in:

1. `~/.config/opencode/themes/*.json` (global)
2. `.opencode/themes/*.json` (project-specific)

### Minimal Theme Template

```json
{
  "$schema": "https://opencode.ai/theme.json",
  "defs": {
    "bg": "#1a1a2e",
    "fg": "#eaeaea",
    "accent1": "#e94560",
    "accent2": "#0f3460",
    "muted": "#666680"
  },
  "theme": {
    "primary": { "dark": "accent1", "light": "#d63447" },
    "secondary": { "dark": "accent2", "light": "#1a508b" },
    "accent": { "dark": "#ffc107", "light": "#ff9800" },
    
    "error": { "dark": "#ff5252", "light": "#d32f2f" },
    "warning": { "dark": "#ffb74d", "light": "#f57c00" },
    "success": { "dark": "#69f0ae", "light": "#00c853" },
    "info": { "dark": "#40c4ff", "light": "#0091ea" },
    
    "text": { "dark": "fg", "light": "#1a1a2e" },
    "textMuted": { "dark": "muted", "light": "#9e9e9e" },
    
    "background": { "dark": "bg", "light": "#fafafa" },
    "backgroundPanel": { "dark": "#16213e", "light": "#f5f5f5" },
    "backgroundElement": { "dark": "#1f2942", "light": "#eeeeee" },
    
    "border": { "dark": "#2a3f5f", "light": "#e0e0e0" },
    "borderActive": { "dark": "accent1", "light": "accent1" },
    "borderSubtle": { "dark": "#1f2942", "light": "#f5f5f5" },
    
    // ... diff colors (12 properties)
    "diffAdded": { "dark": "#69f0ae", "light": "#00c853" },
    "diffRemoved": { "dark": "#ff5252", "light": "#d32f2f" },
    // ... etc
    
    // ... markdown colors (14 properties)
    "markdownHeading": { "dark": "accent1", "light": "accent1" },
    // ... etc
    
    // ... syntax colors (9 properties)
    "syntaxKeyword": { "dark": "accent1", "light": "accent1" },
    // ... etc
  }
}
```

### System Theme Generation

OpenCode can automatically generate a theme from your terminal's colors:

```typescript
// From context/theme.tsx
function generateSystem(colors: TerminalColors, mode: "dark" | "light"): ThemeJson {
  const bg = RGBA.fromHex(colors.defaultBackground ?? colors.palette[0]!)
  const fg = RGBA.fromHex(colors.defaultForeground ?? colors.palette[7]!)
  
  // Maps ANSI colors to semantic colors
  const ansiColors = {
    black: palette[0],
    red: palette[1],      // → error
    green: palette[2],    // → success
    yellow: palette[3],   // → warning
    blue: palette[4],     // → functions
    magenta: palette[5],  // → keywords
    cyan: palette[6],     // → primary
    white: palette[7],    // → text
  }
  
  // Generates gray scale for backgrounds/borders
  const grays = generateGrayScale(bg, isDark)
  
  return { theme: { /* mapped colors */ } }
}
```

---

## Summary

OpenCode's TUI design system demonstrates how to create a rich, visually appealing terminal interface:

| Aspect | Approach |
|--------|----------|
| **Theming** | JSON-based with 80+ semantic color tokens |
| **Layout** | Flexbox model for complex layouts |
| **Animation** | Custom Knight Rider spinner with smooth trails |
| **Typography** | Unicode symbols, bold/muted text, syntax highlighting |
| **Components** | Composable dialogs, toasts, prompts |
| **Responsiveness** | Adapts to terminal size |
| **Extensibility** | Custom themes via JSON files |

The result is a terminal UI that feels modern and polished while respecting the constraints and heritage of text-based interfaces.

