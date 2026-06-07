import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './utils/admin-auth';

test.describe('Admin creates a blog post that appears publicly', () => {
    test.skip(
        !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
        'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set to run this test',
    );

    test('creates a blog post, sees it on the public blog index, then cleans up', async ({
        page,
        browser,
    }) => {
        const title = `E2E Blog Post ${Date.now()}`;

        await loginAsAdmin(page);

        await page.goto('/admin/blogs/create');
        await page
            .getByPlaceholder('Enter an engaging title...')
            .fill(title);
        await page
            .getByPlaceholder('<p>Write your amazing content here...</p>')
            .fill('<p>Created by an automated end-to-end test.</p>');
        await page.locator('select').selectOption('Web Development');

        await page.getByRole('button', { name: /save post/i }).click();

        await page.waitForURL((url) => url.pathname === '/admin/blogs');
        await expect(page.getByText('Blog created.')).toBeVisible();

        // The CMS session is redirected away from public pages, so check the
        // public blog index from a fresh, unauthenticated browser context.
        const visitor = await browser.newContext();
        const publicPage = await visitor.newPage();
        await publicPage.goto('/blogs');
        await expect(
            publicPage.getByRole('heading', { name: title }),
        ).toBeVisible();
        await visitor.close();

        // Clean up: delete the post via the admin CMS so the suite leaves no trace
        await page.goto('/admin/blogs');
        await page
            .getByRole('row', { name: title })
            .getByRole('button', { name: 'Delete' })
            .click();
        await page
            .locator('div')
            .filter({ hasText: 'Are you sure?' })
            .getByRole('button', { name: 'Delete', exact: true })
            .first()
            .click();

        await expect(page.getByText('Blog deleted.')).toBeVisible();
        await expect(page.getByRole('row', { name: title })).toHaveCount(0);
    });
});
