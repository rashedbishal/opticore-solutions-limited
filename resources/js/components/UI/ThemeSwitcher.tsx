import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeSwitcher() {
    const { theme, toggle, mounted } = useTheme();

    if (!mounted) {
        return <div className="h-10 w-10" />;
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        >
            {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
            ) : (
                <Moon className="h-[18px] w-[18px]" />
            )}
        </button>
    );
}
