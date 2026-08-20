import { Moon, Sun } from 'lucide-react';
import IconButton from '../icon-button/icon-button';
import { useTheme } from '../../../utils/hooks/useTheme';

/**
 * Flips `data-theme` between dark and light via `useTheme`, which persists
 * the choice to `localStorage` — the mechanism satisfying the dashboard's
 * "user preferences" requirement.
 *
 * The icon shown is the theme a click would switch *to*, not the current one
 * (a moon while dark, offering light) — the common convention for this
 * control, and the one already used for `active`-style toggles elsewhere in
 * the header.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isLight = theme === 'light';

  return (
    <IconButton
      icon={isLight ? Moon : Sun}
      label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      tone="ghost"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
    />
  );
}
