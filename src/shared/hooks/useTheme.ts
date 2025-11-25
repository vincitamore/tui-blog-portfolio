import { useState, useEffect, useCallback } from 'react';
import {
  type ThemeName,
  themes,
  applyTheme,
  initTheme,
} from '../lib/theme';

/**
 * Hook for managing the current theme.
 */
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('matrix');

  useEffect(() => {
    const theme = initTheme();
    setCurrentTheme(theme);
  }, []);

  const setTheme = useCallback((theme: ThemeName) => {
    applyTheme(theme);
    setCurrentTheme(theme);
  }, []);

  const cycleTheme = useCallback(() => {
    const themeNames = Object.keys(themes) as ThemeName[];
    const currentIndex = themeNames.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    setTheme(themeNames[nextIndex]);
  }, [currentTheme, setTheme]);

  return {
    currentTheme,
    setTheme,
    cycleTheme,
    themes,
  };
}

export default useTheme;

