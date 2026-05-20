import '../css/app.css';

import type { ComponentType, ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppLayout from '@/components/Layout/AppLayout';

const appName = 'Opticore Solutions Ltd.';

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

    const [{ configureEcho, echo }, { default: axios }, { default: Pusher }] =
        await Promise.all([
            import('@laravel/echo-react'),
            import('axios'),
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
        authorizer: (channel: any) => {
            return {
                authorize: (
                    socketId: string,
                    callback: (error: any, data?: any) => void,
                ) => {
                    axios
                        .post('/broadcasting/auth', {
                            socket_id: socketId,
                            channel_name: channel.name,
                        })
                        .then((response) => {
                            callback(null, response.data);
                        })
                        .catch((error) => {
                            callback(error);
                        });
                },
            };
        },
    });

    window.__echoConfigured = true;
    window.dispatchEvent(new Event('echo:configured'));

    axios.interceptors.request.use((config) => {
        try {
            const socketId = echo().socketId();

            if (socketId) {
                config.headers['X-Socket-ID'] = socketId;
            }
        } catch {
            // Echo not yet connected — no socket ID available.
        }

        return config;
    });
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
        if (import.meta.env.SSR) {
            return;
        }

        if ('requestIdleCallback' in window) {
            (
                window as Window & {
                    requestIdleCallback: (callback: () => void) => void;
                }
            ).requestIdleCallback(() => void initializeRealtime());
        } else {
            setTimeout(() => void initializeRealtime(), 0);
        }

        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
});
