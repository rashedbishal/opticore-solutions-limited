import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import type { ReactElement, ReactNode } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppLayout from '@/components/Layout/AppLayout';

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
        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
});
