/**
 * Theme management utilities.
 * Supports multiple terminal-inspired themes.
 */

export type ThemeName = 'matrix' | 'amber' | 'cyan' | 'phosphor';

export interface Theme {
  name: ThemeName;
  label: string;
  primary: string;
  background: string;
  accent: string;
}

export const themes: Record<ThemeName, Theme> = {
  matrix: {
    name: 'matrix',
    label: 'Matrix Green',
    primary: '#00ff00',
    background: '#000000',
    accent: '#00cc00',
  },
  amber: {
    name: 'amber',
    label: 'Amber CRT',
    primary: '#ffb000',
    background: '#1a1200',
    accent: '#ff8c00',
  },
  cyan: {
    name: 'cyan',
    label: 'Cyan Terminal',
    primary: '#00ffff',
    background: '#001a1a',
    accent: '#00cccc',
  },
  phosphor: {
    name: 'phosphor',
    label: 'Phosphor White',
    primary: '#c0c0c0',
    background: '#0a0a0a',
    accent: '#ffffff',
  },
};

const THEME_STORAGE_KEY = 'tui-theme';

/**
 * Get the current theme from localStorage or default to matrix.
 */
export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return 'matrix';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && stored in themes) {
    return stored as ThemeName;
  }
  return 'matrix';
}

/**
 * Save the theme to localStorage.
 */
export function setStoredTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Apply theme CSS variables to the document root.
 */
export function applyTheme(themeName: ThemeName): void {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-accent', theme.accent);

  // Update Tailwind-compatible classes
  root.style.setProperty('--ansi-green', theme.primary);
  root.style.setProperty('--terminal-black', theme.background);

  setStoredTheme(themeName);
}

/**
 * Initialize theme on app load.
 */
export function initTheme(): ThemeName {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}



