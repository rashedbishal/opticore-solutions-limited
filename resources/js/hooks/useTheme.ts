import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'preferred-theme';

function applyTheme(theme: Theme): void {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function resolveTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') {
        return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const resolved = resolveTheme();
        setTheme(resolved);
        applyTheme(resolved);
        setMounted(true);
    }, []);

    const toggle = () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    };

    return { theme, toggle, mounted };
}
