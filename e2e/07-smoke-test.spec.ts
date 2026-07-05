import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Static, always-present public pages — no seeded data required.
const STATIC_PAGES = [
    '/',
    '/about-us',
    '/message-from-md',
    '/career',
    '/faq',
    '/blogs',
    '/privacy-policy',
    '/terms-conditions',
];

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

function trackPageErrors(page: Page) {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', (err) => {
        pageErrors.push(err.message);
    });

    return { consoleErrors, pageErrors };
}

test.describe('Site-wide smoke test', () => {
    for (const path of STATIC_PAGES) {
        test(`${path} loads without errors`, async ({ page }) => {
            const { consoleErrors, pageErrors } = trackPageErrors(page);

            const response = await page.goto(path);

            expect(
                response?.status(),
                `${path} returned an unexpected HTTP status`,
            ).toBeLessThan(400);
            expect(consoleErrors, `console errors on ${path}`).toEqual([]);
            expect(pageErrors, `uncaught JS exceptions on ${path}`).toEqual([]);
        });
    }

    test('a real service page (discovered from the footer) loads without errors', async ({
        page,
    }) => {
        await page.goto('/');

        // Service pages are CMS-managed Category slugs (e.g. /video-editing)
        // that vary per environment/seed data, so the link is discovered
        // from the footer's "Services" section rather than hardcoded.
        const servicesHeading = page.getByRole('heading', {
            name: 'Services',
            exact: true,
        });
        const serviceLink = servicesHeading
            .locator('xpath=following-sibling::div[1]//a')
            .first();

        test.skip(
            (await serviceLink.count()) === 0,
            'No service links found in the footer — nothing to smoke test',
        );

        const href = await serviceLink.getAttribute('href');
        const { consoleErrors, pageErrors } = trackPageErrors(page);

        const response = await page.goto(href!);

        expect(
            response?.status(),
            `${href} returned an unexpected HTTP status`,
        ).toBeLessThan(400);
        expect(consoleErrors, `console errors on ${href}`).toEqual([]);
        expect(pageErrors, `uncaught JS exceptions on ${href}`).toEqual([]);
    });

    test.describe('authenticated pages', () => {
        test.skip(
            !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
            'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set to run this test',
        );

        test('dashboard and checkout load without errors', async ({ page }) => {
            await page.goto('/login');
            await page.locator('input[name="email"]').fill(TEST_USER_EMAIL!);
            await page
                .locator('input[name="password"]')
                .fill(TEST_USER_PASSWORD!);
            await Promise.all([
                page.waitForNavigation(),
                page.getByRole('button', { name: /sign in/i }).click(),
            ]);

            for (const path of [
                '/dashboard',
                '/checkout?service=Smoke+Test&plan=Basic&price=%2410&delivery=1+Day&category=smoke&subcategory=smoke&subcategory_id=0',
            ]) {
                const { consoleErrors, pageErrors } = trackPageErrors(page);
                const response = await page.goto(path);

                expect(
                    response?.status(),
                    `${path} returned an unexpected HTTP status`,
                ).toBeLessThan(400);
                expect(consoleErrors, `console errors on ${path}`).toEqual([]);
                expect(pageErrors, `uncaught JS exceptions on ${path}`).toEqual(
                    [],
                );
            }
        });
    });
});
