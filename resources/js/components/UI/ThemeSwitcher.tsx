import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export default function ThemeSwitcher({ className }: { className?: string }) {
    const { theme, toggle, mounted } = useTheme();

    // Shared with the pre-hydration placeholder below so the button's shape
    // (rounded-full, border, background) is identical before and after
    // `mounted` flips true — only the icon glyph is missing during SSR/the
    // pre-hydration render, not the shape, so the button doesn't pop from a
    // square into a circle once React hydrates.
    const shellClassName = cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
        'border border-black/20 bg-black/5 text-zinc-600 hover:border-black/30 hover:bg-black/10 hover:text-black',
        'dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white',
        className,
    );

    if (!mounted) {
        return <div className={shellClassName} aria-hidden="true" />;
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={shellClassName}
        >
            {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
            ) : (
                <Moon className="h-[18px] w-[18px]" />
            )}
        </button>
    );
}
