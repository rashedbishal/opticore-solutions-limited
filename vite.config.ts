import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig(({ command }) => ({
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
        host: 'localhost',
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
                    if (id.includes('node_modules/@studio-freight/lenis/')) {
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
}));
