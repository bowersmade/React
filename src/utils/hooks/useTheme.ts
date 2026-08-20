import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'sentinel-theme';

/**
 * Dark is the app's native theme — every colour in the design system was
 * built against it first, light came second — so it is the fallback when
 * there is no stored choice and no OS preference either way, rather than
 * deferring to `prefers-color-scheme` in both directions.
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Reads and writes `sentinel-theme` in localStorage, and mirrors the current
 * value onto `<html data-theme>`, which is what `global.css`'s
 * `[data-theme='light']` block actually keys off. Applying it here rather
 * than only in CSS is what makes the choice persist across a reload instead
 * of resetting to the OS preference every time.
 *
 * Applied to `<html>`, not `<body>`, so it is set before React hydrates
 * anything inside `<body>` — see the inline script in `index.html` for the
 * first-paint half of that; this hook is what keeps it in sync afterward.
 */
export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: Theme) => setThemeState(next);

  return [theme, setTheme];
}
