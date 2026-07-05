import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    // Applies to every toHaveScreenshot() call (e2e/08-visual-regression.spec.ts):
    // animations 'disabled' finishes CSS transitions/animations before
    // capturing, and the pixel-ratio tolerance absorbs minor anti-aliasing/
    // font-rendering noise between machines — it does NOT cover JS-driven
    // (canvas/Framer Motion/GSAP) animation, which that spec masks/avoids
    // directly instead.
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.02,
            animations: 'disabled',
        },
    },
    use: {
        baseURL: process.env.APP_URL || 'http://localhost:8000',
        headless: true,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
