import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

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
            className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
                'border border-black/20 bg-black/5 text-zinc-600 hover:border-black/30 hover:bg-black/10 hover:text-black',
                'dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white',
            )}
        >
            {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
            ) : (
                <Moon className="h-[18px] w-[18px]" />
            )}
        </button>
    );
}
