import { expect, test } from '@playwright/test';

// A deliberately small, representative set — not every page. Visual
// regression baselines need re-approving on every real content/layout
// change, so covering the whole site here would turn routine copy edits
// into constant snapshot churn.
const PAGES_TO_SNAPSHOT = [
    { name: 'home', path: '/' },
    { name: 'about-us', path: '/about-us' },
    { name: 'faq', path: '/faq' },
    { name: 'blogs', path: '/blogs' },
    { name: 'contact', path: '/contact' },
];

const THEMES = ['light', 'dark'] as const;

// Baselines were generated on this Linux dev machine. CI also runs on
// ubuntu-latest, but font-rendering can still drift slightly between
// distros/font packages — if CI starts failing on pixel diffs alone (not a
// real visual regression), re-generate baselines from within CI itself
// (`npx playwright test e2e/08-visual-regression.spec.ts --update-snapshots`)
// rather than raising the tolerance blindly.
for (const theme of THEMES) {
    test.describe(`Visual regression (${theme} theme)`, () => {
        test.use({ colorScheme: theme });

        for (const { name, path } of PAGES_TO_SNAPSHOT) {
            test(`${name} page matches baseline`, async ({ page }) => {
                await page.goto(path);
                await page.waitForLoadState('networkidle');

                await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
                    fullPage: true,
                    // Three.js/particle sections render to <canvas> and
                    // animate continuously regardless of prefers-reduced-
                    // motion, which this codebase doesn't generally honor
                    // outside one admin component — masking is the only
                    // reliable way to keep those pages from flaking.
                    mask: [page.locator('canvas')],
                });
            });
        }

        test('a real service page (discovered from the footer) matches baseline', async ({
            page,
        }) => {
            await page.goto('/');

            const servicesHeading = page.getByRole('heading', {
                name: 'Services',
                exact: true,
            });
            const serviceLink = servicesHeading
                .locator('xpath=following-sibling::div[1]//a')
                .first();

            test.skip(
                (await serviceLink.count()) === 0,
                'No service links found in the footer — nothing to snapshot',
            );

            const href = await serviceLink.getAttribute('href');

            await page.goto(href!);
            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot(`service-page-${theme}.png`, {
                fullPage: true,
                mask: [page.locator('canvas')],
            });
        });
    });
}
