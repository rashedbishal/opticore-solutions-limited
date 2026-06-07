import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './utils/admin-auth';

test.describe('Admin updates a portfolio sub-category and the change reflects publicly', () => {
    test.skip(
        !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
        'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set to run this test',
    );

    test('edits the description of an existing sub-category, verifies it publicly, then restores it', async ({
        page,
        browser,
    }) => {
        const marker = `[E2E ${Date.now()}]`;

        await loginAsAdmin(page);

        await page.goto('/admin/sub-categories');
        await page
            .locator('tbody tr')
            .first()
            .getByRole('link', { name: /edit/i })
            .click();
        await page.waitForURL(/\/admin\/sub-categories\/.+\/edit/);

        const form = page.locator('form').first();
        const categorySlug = await form.locator('select').first().inputValue();
        const slug = await form.locator('input').nth(1).inputValue();
        const descriptionField = form.locator('textarea').first();
        const originalDescription = await descriptionField.inputValue();
        const updatedDescription = `${originalDescription} ${marker}`.trim();

        await descriptionField.fill(updatedDescription);
        await page
            .getByRole('button', { name: /update sub-category/i })
            .click();

        await page.waitForURL((url) => url.pathname === '/admin/sub-categories');
        await expect(page.getByText('Sub-category updated.')).toBeVisible();

        // The CMS session is redirected away from public pages, so check the
        // public sub-category page from a fresh, unauthenticated browser context.
        const visitor = await browser.newContext();
        const publicPage = await visitor.newPage();
        await publicPage.goto(`/portfolio/${categorySlug}/${slug}`);
        await expect(publicPage.getByText(updatedDescription)).toBeVisible();
        await visitor.close();

        // Restore the original description so the suite leaves no trace
        await page.goto(`/admin/sub-categories/${slug}/edit`);
        await form.locator('textarea').first().fill(originalDescription);
        await page
            .getByRole('button', { name: /update sub-category/i })
            .click();
        await page.waitForURL((url) => url.pathname === '/admin/sub-categories');
        await expect(page.getByText('Sub-category updated.')).toBeVisible();
    });
});
