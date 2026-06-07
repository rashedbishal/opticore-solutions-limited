import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './utils/admin-auth';

test.describe('Admin creates a testimonial that appears on the homepage', () => {
    test.skip(
        !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
        'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set to run this test',
    );

    test('creates a testimonial, sees it on the homepage, then cleans up', async ({
        page,
        browser,
    }) => {
        const name = `E2E Tester ${Date.now()}`;

        await loginAsAdmin(page);

        await page.goto('/admin/testimonials/create');
        await page.getByPlaceholder('e.g. Alex Rivera').fill(name);
        await page.getByPlaceholder('e.g. TechFlow').fill('Opticore E2E Co.');
        await page.getByPlaceholder('e.g. CEO').fill('Founder');
        await page
            .getByPlaceholder('What the client said...')
            .fill('Automated end-to-end testing kept this launch on track.');

        await page
            .getByRole('button', { name: /save testimonial/i })
            .click();

        await page.waitForURL((url) => url.pathname === '/admin/testimonials');
        await expect(page.getByText('Testimonial created.')).toBeVisible();

        // The CMS session is redirected away from public pages, so check the
        // homepage from a fresh, unauthenticated browser context.
        const visitor = await browser.newContext();
        const publicPage = await visitor.newPage();
        await publicPage.goto('/');

        // The testimonials carousel mounts lazily once scrolled near it.
        await expect(async () => {
            await publicPage.mouse.wheel(0, 1000);
            await expect(publicPage.getByText(name)).toBeVisible({
                timeout: 1000,
            });
        }).toPass({ timeout: 30_000 });

        await visitor.close();

        // Clean up: delete the testimonial via the admin CMS so the suite leaves no trace
        await page.goto('/admin/testimonials');
        await page
            .getByRole('row', { name })
            .getByRole('button', { name: 'Delete' })
            .click();
        await page
            .locator('div')
            .filter({ hasText: 'Are you sure?' })
            .getByRole('button', { name: 'Delete', exact: true })
            .first()
            .click();

        await expect(page.getByText('Testimonial deleted.')).toBeVisible();
        await expect(page.getByRole('row', { name })).toHaveCount(0);
    });
});
