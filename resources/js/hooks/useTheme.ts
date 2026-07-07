import { useEffect, useState, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'preferred-theme';
const THEME_CHANGE_EVENT = 'opticore:theme-change';

// Kept in sync with the inline pre-hydration script in app.blade.php and the
// `:root`/`.dark` --background tokens in app.css, so the browser chrome
// (address bar, task switcher) always matches what the toggle actually
// renders instead of following the OS's prefers-color-scheme independently.
const THEME_COLOR: Record<Theme, string> = {
    light: '#fcfcfd',
    dark: '#0a0a0a',
};

function applyTheme(theme: Theme): void {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', THEME_COLOR[theme]);
}

function resolveTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;

    if (stored === 'dark' || stored === 'light') {
        return stored;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function getServerSnapshot(): Theme {
    return 'light';
}

function subscribe(callback: () => void): () => void {
    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQueryList.addEventListener('change', callback);
    window.addEventListener(THEME_CHANGE_EVENT, callback);

    return () => {
        mediaQueryList.removeEventListener('change', callback);
        window.removeEventListener(THEME_CHANGE_EVENT, callback);
    };
}

export function useTheme() {
    // useSyncExternalStore is the SSR-safe way to read browser-only state:
    // it renders getServerSnapshot() ('light') during SSR and the initial
    // client hydration pass — matching the server output exactly — then
    // switches to the real resolveTheme() value right after, without
    // tripping a React hydration mismatch (error #418).
    const theme = useSyncExternalStore(
        subscribe,
        resolveTheme,
        getServerSnapshot,
    );
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

        localStorage.setItem(STORAGE_KEY, next);
        // localStorage writes don't fire a `storage` event in the same tab,
        // so dispatch our own event for subscribe() to pick up.
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    };

    return { theme, toggle, mounted };
}
