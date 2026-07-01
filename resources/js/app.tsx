import '../css/app.css';

import type { ComponentType, ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import AppLayout from '@/components/Layout/AppLayout';
import LogoutOverlay from '@/components/UI/LogoutOverlay';

const appName = 'Opticore Solutions Limited';

type InertiaPageComponent = ComponentType<any> & {
    layout?: (page: ReactNode) => ReactNode;
};

interface InertiaPageModule {
    default: InertiaPageComponent;
}

const pages = import.meta.glob<InertiaPageModule>('./pages/**/*.tsx');
let realtimeInitialized = false;

const initializeRealtime = async () => {
    if (realtimeInitialized || typeof window === 'undefined') {
        return;
    }

    realtimeInitialized = true;

    const [{ configureEcho, echo }, { default: Pusher }] = await Promise.all([
        import('@laravel/echo-react'),
        import('pusher-js'),
    ]);

    (window as any).Pusher = Pusher;

    configureEcho({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: parseInt(import.meta.env.VITE_REVERB_PORT ?? '8080', 10),
        wssPort: parseInt(import.meta.env.VITE_REVERB_PORT ?? '8080', 10),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel: any) => ({
            authorize: (
                socketId: string,
                callback: (error: any, data?: any) => void,
            ) => {
                fetch('/broadcasting/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                    .then((r) => r.json())
                    .then((data) => callback(null, data))
                    .catch((error) => callback(error));
            },
        }),
    });

    // Expose echo instance so apiFetch can attach X-Socket-ID to requests.
    (window as any).__echoInstance = echo();

    window.__echoConfigured = true;
    window.dispatchEvent(new Event('echo:configured'));
};

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    progress: {
        color: '#7C3AED',
        includeCSS: true,
        showSpinner: false,
    },
    resolve: async (name) => {
        const loadPage = pages[`./pages/${name}.tsx`];

        if (!loadPage) {
            throw new Error(`Unknown Inertia page: ${name}`);
        }

        const page = await loadPage();
        page.default.layout ??= (pageNode: ReactNode) => (
            <AppLayout>{pageNode}</AppLayout>
        );

        return page.default;
    },
    setup({ el, App, props }) {
        if ('requestIdleCallback' in window) {
            (
                window as Window & {
                    requestIdleCallback: (callback: () => void) => void;
                }
            ).requestIdleCallback(() => void initializeRealtime());
        } else {
            setTimeout(() => void initializeRealtime(), 0);
        }

        const app = (
            <StrictMode>
                <LogoutOverlay />
                <App {...props} />
            </StrictMode>
        );

        // HandleInertiaRequests::$withoutSsr skips SSR for admin/dashboard/
        // checkout/etc., so #app is empty for those pages — hydrateRoot()
        // requires existing server-rendered markup to reconcile against,
        // and throws a hydration-mismatch error (#418) against an empty
        // container. Use createRoot() for those instead; hydrateRoot() only
        // for pages that actually came from the SSR-rendered root template.
        if (el.hasChildNodes()) {
            hydrateRoot(el, app);
        } else {
            createRoot(el).render(app);
        }
    },
});
