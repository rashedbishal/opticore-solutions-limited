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
    const stored =
        typeof window !== 'undefined'
            ? (localStorage.getItem(STORAGE_KEY) as Theme | null)
            : null;

    if (stored === 'dark' || stored === 'light') {
        return stored;
    }

    return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(resolveTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        queueMicrotask(() => {
            setMounted(true);
        });
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const toggle = () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';

        setTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    };

    return { theme, toggle, mounted };
}
