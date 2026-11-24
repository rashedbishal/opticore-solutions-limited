import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig(({ command, mode }) => {
    // Browsers can't load assets from the 0.0.0.0 bind address, so advertise
    // the host from APP_URL (e.g. the LAN IP) as the dev server's public origin.
    const env = loadEnv(mode, process.cwd(), '');
    const devHost = new URL(env.APP_URL || 'http://localhost').hostname;

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                refresh: true,
            }),
            inertia(),
            react({
                babel: {
                    plugins: ['babel-plugin-react-compiler'],
                },
            }),
            tailwindcss(),
            wayfinder({
                formVariants: true,
            }),
        ],

        server: {
            host: '0.0.0.0',
            port: 5173,
            // `origin` and public/hot hardcode this port, so fail loudly
            // instead of silently moving to 5174 when it's taken.
            strictPort: true,
            origin: `http://${devHost}:5173`,
            watch: {
                // None of these affect the frontend; watching them just
                // burns CPU and can trigger spurious reloads.
                ignored: [
                    '**/.agents/**',
                    '**/.claude/**',
                    '**/.cursor/**',
                    '**/.junie/**',
                    '**/vendor/**',
                    '**/storage/**',
                ],
            },
            // The page is served from Laravel (:8000) while modules come from Vite
            // (:5173), so Vite must allow that cross-origin request. Limit it to
            // localhost and private LAN addresses.
            cors: {
                origin: [
                    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/,
                ],
            },
        },

        // noExternal bundles all deps into the SSR output for deployment
        // environments without node_modules, but breaks Vite 8's Rolldown-based
        // module runner in dev (CJS globals like `module` aren't shimmed in the
        // ESM eval context). Omit entirely in dev so Vite resolves deps natively.
        ...(command === 'build' && { ssr: { noExternal: true } }),

        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (
                            id.includes('node_modules/react/') ||
                            id.includes('node_modules/react-dom/') ||
                            id.includes('node_modules/scheduler/')
                        ) {
                            return 'vendor-react';
                        }

                        if (
                            id.includes('node_modules/framer-motion/') ||
                            id.includes('node_modules/motion-dom/') ||
                            id.includes('node_modules/motion-utils/') ||
                            id.includes('node_modules/@motionone/')
                        ) {
                            return 'vendor-framer';
                        }

                        if (
                            id.includes('node_modules/three/') ||
                            id.includes('node_modules/@react-three/')
                        ) {
                            return 'vendor-three';
                        }

                        if (id.includes('node_modules/gsap/')) {
                            return 'vendor-gsap';
                        }

                        // Split lenis (loaded on every page via SmoothScroll/AppLayout)
                        // from animejs (only needed when SectionHeader renders).
                        if (
                            id.includes('node_modules/@studio-freight/lenis/')
                        ) {
                            return 'vendor-lenis';
                        }

                        if (id.includes('node_modules/animejs/')) {
                            return 'vendor-animejs';
                        }

                        if (id.includes('node_modules/radix-ui/')) {
                            return 'vendor-radix';
                        }
                    },
                },
            },
        },

        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./resources/js/test-setup.js'],
            // Without this, Vitest's default include glob also matches the
            // Playwright specs under e2e/*.spec.ts and tries to run them as
            // unit tests, failing immediately since they call test.describe()
            // outside of Playwright's runner.
            exclude: [...configDefaults.exclude, 'e2e/**'],
        },
    };
});
