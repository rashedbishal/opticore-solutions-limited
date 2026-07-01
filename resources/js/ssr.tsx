import type { ComponentType, ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import AppLayout from '@/components/Layout/AppLayout';

const appName = 'Opticore Solutions Limited';

type InertiaPageComponent = ComponentType<any> & {
    layout?: (page: ReactNode) => ReactNode;
};

interface InertiaPageModule {
    default: InertiaPageComponent;
}

createServer((page) =>
    createInertiaApp({
        page,
        title: (title) => (title ? `${title} — ${appName}` : appName),
        render: ReactDOMServer.renderToString,
        resolve: async (name) => {
            const pages = import.meta.glob<InertiaPageModule>(
                './pages/**/*.tsx',
            );
            const loadPage = pages[`./pages/${name}.tsx`];

            if (!loadPage) {
                throw new Error(`Unknown Inertia page: ${name}`);
            }

            const resolvedPage = await loadPage();
            resolvedPage.default.layout ??= (pageNode: ReactNode) => (
                <AppLayout>{pageNode}</AppLayout>
            );

            return resolvedPage.default;
        },
        setup: ({ App, props }) => <App {...props} />,
    }),
);
