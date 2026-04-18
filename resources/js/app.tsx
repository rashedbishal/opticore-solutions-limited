import '../css/app.css';

import type { ReactElement, ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { configureEcho, echo } from '@laravel/echo-react';
import axios from 'axios';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppLayout from '@/components/Layout/AppLayout';

configureEcho({
    broadcaster: 'reverb',
});

// Attach the current Echo socket ID to every Axios request so that
// broadcast()->toOthers() can correctly exclude the sender's own tab.
// Without this header, Laravel cannot identify the sender and broadcasts
// back to them too, causing duplicate messages.
axios.interceptors.request.use((config) => {
    try {
        const socketId = echo().socketId();

        if (socketId) {
            config.headers['X-Socket-ID'] = socketId;
        }
    } catch {
        // Echo not yet connected — no socket ID available, skip
    }

    return config;
});

const appName = import.meta.env.VITE_APP_NAME || 'Opticore Solutions Ltd.';

interface InertiaPageModule {
    default: InertiaPageComponent;
}

interface InertiaPageComponent {
    (props: Record<string, unknown>): ReactElement;
    layout?: (page: ReactNode) => ReactNode;
}

const pages = import.meta.glob<InertiaPageModule>('./pages/**/*.tsx', {
    eager: true,
});

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    progress: {
        color: '#7C3AED',
        includeCSS: true,
        showSpinner: false,
    },
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Unknown Inertia page: ${name}`);
        }

        page.default.layout ??= (pageNode: ReactNode) => (
            <AppLayout>{pageNode}</AppLayout>
        );

        return page;
    },
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            return;
        }

        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
});
