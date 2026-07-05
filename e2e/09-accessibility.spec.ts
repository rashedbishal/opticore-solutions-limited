import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Same representative set as the smoke test — not every page, but enough
// shared layout/component coverage (header, footer, forms) that a
// regression almost anywhere would show up on at least one of these.
const PAGES_TO_CHECK = [
    '/',
    '/about-us',
    '/message-from-md',
    '/career',
    '/faq',
    '/blogs',
    '/contact',
];

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Accessibility (axe)', () => {
    for (const path of PAGES_TO_CHECK) {
        test(`${path} has no automatically-detectable accessibility violations`, async ({
            page,
        }) => {
            await page.goto(path);
            await page.waitForLoadState('networkidle');

            const results = await new AxeBuilder({ page }).analyze();

            expect(
                results.violations,
                results.violations
                    .map(
                        (v) =>
                            `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
                    )
                    .join('\n'),
            ).toEqual([]);
        });
    }

    test('a real service page (discovered from the footer) has no violations', async ({
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
            'No service links found in the footer — nothing to check',
        );

        const href = await serviceLink.getAttribute('href');

        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        const results = await new AxeBuilder({ page }).analyze();

        expect(
            results.violations,
            results.violations
                .map(
                    (v) =>
                        `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
                )
                .join('\n'),
        ).toEqual([]);
    });

    test.describe('authenticated pages', () => {
        test.skip(
            !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
            'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set to run this test',
        );

        test('dashboard has no automatically-detectable accessibility violations', async ({
            page,
        }) => {
            await page.goto('/login');
            await page.locator('input[name="email"]').fill(TEST_USER_EMAIL!);
            await page
                .locator('input[name="password"]')
                .fill(TEST_USER_PASSWORD!);
            await Promise.all([
                page.waitForNavigation(),
                page.getByRole('button', { name: /sign in/i }).click(),
            ]);

            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');

            const results = await new AxeBuilder({ page }).analyze();

            expect(
                results.violations,
                results.violations
                    .map(
                        (v) =>
                            `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
                    )
                    .join('\n'),
            ).toEqual([]);
        });
    });
});
