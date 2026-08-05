import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink transition hover:border-ink/40 dark:border-lineDark dark:text-paper dark:hover:border-paper/40"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
